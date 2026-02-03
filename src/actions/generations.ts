"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  createGenerationSchema,
  type CreateGenerationInput,
  MAX_BACKGROUNDS,
  FREE_TIER_MONTHLY_QUOTA,
} from "@/lib/validations/generations"
import { triggerN8nWorkflow } from "@/lib/n8n/client"
import { isAdmin } from "@/lib/admin"

/**
 * Generate signed upload URLs for background images.
 * Client will upload files directly to Supabase Storage using these URLs.
 *
 * Flow:
 * 1. Client calls createBackgroundUploadUrls(N)
 * 2. Client uploads files directly to Supabase Storage
 * 3. Client calls createGeneration with the resulting storage paths
 */
export async function createBackgroundUploadUrls(count: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  if (count < 1 || count > MAX_BACKGROUNDS) {
    return { error: `Must request between 1 and ${MAX_BACKGROUNDS} upload URLs` }
  }

  const urls: Array<{ path: string; signedUrl: string }> = []
  const timestamp = Date.now()

  for (let i = 0; i < count; i++) {
    const path = `${user.id}/${timestamp}-${i}.jpg`

    const { data, error } = await supabase.storage
      .from("backgrounds")
      .createSignedUploadUrl(path)

    if (error) {
      return { error: `Failed to create upload URL: ${error.message}` }
    }

    urls.push({
      path,
      signedUrl: data.signedUrl,
    })
  }

  return { success: true, urls }
}

/**
 * Create a new thumbnail generation request.
 *
 * This function:
 * 1. Validates inputs
 * 2. Checks monthly quota (unless admin)
 * 3. Creates generation record in database
 * 4. Triggers n8n workflow
 * 5. Returns generation ID for client to subscribe to via Realtime
 */
export async function createGeneration(input: CreateGenerationInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Validate inputs
  const parsed = createGenerationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { portraitId, keywords, backgroundPaths } = parsed.data

  // Check quota (unless admin)
  const adminUser = isAdmin(user.email)
  if (!adminUser) {
    // Count generations this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count, error: countError } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())

    if (countError) {
      return { error: "Failed to check quota" }
    }

    if ((count ?? 0) >= FREE_TIER_MONTHLY_QUOTA) {
      return {
        error: `Monthly limit reached (${FREE_TIER_MONTHLY_QUOTA} generations). Upgrade to continue.`,
      }
    }
  }

  // Verify portrait exists and belongs to user
  const { data: portrait, error: portraitError } = await supabase
    .from("portraits")
    .select("id, public_url")
    .eq("id", portraitId)
    .eq("user_id", user.id)
    .single()

  if (portraitError || !portrait) {
    return { error: "Portrait not found" }
  }

  // Build public URLs for backgrounds
  const backgroundUrls = backgroundPaths.map((path) => {
    const { data } = supabase.storage.from("backgrounds").getPublicUrl(path)
    return data.publicUrl
  })

  // Create generation record
  const { data: generation, error: createError } = await supabase
    .from("generations")
    .insert({
      user_id: user.id,
      portrait_id: portraitId,
      portrait_url: portrait.public_url,
      keywords: keywords,
      background_count: backgroundPaths.length,
      status: "pending",
      progress: 0,
      current_step: "Queued",
    })
    .select("id")
    .single()

  if (createError || !generation) {
    return { error: createError?.message ?? "Failed to create generation" }
  }

  // Trigger n8n workflow
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n-callback`

  try {
    await triggerN8nWorkflow({
      generation_id: generation.id,
      portrait_url: portrait.public_url,
      background_urls: backgroundUrls,
      keywords: keywords,
      callback_url: callbackUrl,
    })

    // Update status to processing
    await supabase
      .from("generations")
      .update({
        status: "processing",
        current_step: "Starting workflow",
        started_at: new Date().toISOString(),
      })
      .eq("id", generation.id)
  } catch (error) {
    // Update status to failed if n8n trigger fails
    await supabase
      .from("generations")
      .update({
        status: "failed",
        error_message:
          error instanceof Error ? error.message : "Failed to start workflow",
      })
      .eq("id", generation.id)

    return {
      error: "Failed to start thumbnail generation. Please try again.",
    }
  }

  revalidatePath("/gallery")

  return { success: true, generationId: generation.id }
}

/**
 * Get the current user's monthly generation count and quota.
 */
export async function getGenerationQuota() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const adminUser = isAdmin(user.email)

  // Count generations this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString())

  if (error) {
    return { error: "Failed to get quota" }
  }

  return {
    success: true,
    used: count ?? 0,
    limit: adminUser ? Infinity : FREE_TIER_MONTHLY_QUOTA,
    isAdmin: adminUser,
  }
}
