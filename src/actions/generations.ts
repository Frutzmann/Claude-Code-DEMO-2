"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  createGenerationSchema,
  type CreateGenerationInput,
  MAX_BACKGROUNDS,
} from "@/lib/validations/generations"
import { triggerN8nWorkflow } from "@/lib/n8n/client"
import { isAdmin } from "@/lib/admin"
import { getPlanByPriceId, getPlanQuota, type PlanId } from "@/lib/billing/plans"

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

  if (count < 0 || count > MAX_BACKGROUNDS) {
    return { error: `Must request between 0 and ${MAX_BACKGROUNDS} upload URLs` }
  }

  if (count === 0) {
    return { success: true, urls: [] }
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
    // Get active subscription to determine plan and billing period
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("price_id, current_period_start, current_period_end, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .single()

    // Determine plan and quota
    const plan = getPlanByPriceId(subscription?.price_id ?? null)
    const quota = getPlanQuota(plan)

    // Determine period start (billing period for subscribers, calendar month for free)
    let periodStart: Date
    if (subscription?.current_period_start) {
      periodStart = new Date(subscription.current_period_start)
    } else {
      // Free tier: use calendar month
      periodStart = new Date()
      periodStart.setDate(1)
      periodStart.setHours(0, 0, 0, 0)
    }

    const { count, error: countError } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", periodStart.toISOString())

    if (countError) {
      return { error: "Failed to check quota" }
    }

    if ((count ?? 0) >= quota) {
      return {
        error: `Monthly limit reached (${quota} generations on ${plan} plan). Upgrade to continue.`,
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
  try {
    await triggerN8nWorkflow({
      generation_id: generation.id,
      portrait_url: portrait.public_url,
      background_urls: backgroundUrls,
      keywords: keywords,
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
 * Get the current user's generation quota and usage for their billing period.
 * Uses Stripe billing period for paid users, calendar month for free tier.
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

  // Admin gets unlimited access with fast-path return
  if (adminUser) {
    return {
      success: true,
      used: 0,
      limit: Infinity,
      isAdmin: true,
      plan: "admin" as const,
      periodEnd: null,
    }
  }

  // Get active subscription to determine plan and billing period
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("price_id, current_period_start, current_period_end, status")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .single()

  // Determine plan and quota
  console.log('[Quota] Subscription:', subscription)
  console.log('[Quota] Price ID from DB:', subscription?.price_id)
  console.log('[Quota] STRIPE_PRICE_PRO env:', process.env.STRIPE_PRICE_PRO)
  console.log('[Quota] STRIPE_PRICE_AGENCY env:', process.env.STRIPE_PRICE_AGENCY)
  const plan = getPlanByPriceId(subscription?.price_id ?? null)
  console.log('[Quota] Resolved plan:', plan)
  const quota = getPlanQuota(plan)

  // Determine period (billing period for subscribers, calendar month for free)
  let periodStart: Date
  let periodEnd: Date | null = null

  if (subscription?.current_period_start && subscription?.current_period_end) {
    periodStart = new Date(subscription.current_period_start)
    periodEnd = new Date(subscription.current_period_end)
  } else {
    // Free tier: use calendar month
    periodStart = new Date()
    periodStart.setDate(1)
    periodStart.setHours(0, 0, 0, 0)
  }

  // Count generations in current period
  const { count, error } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", periodStart.toISOString())

  if (error) {
    return { error: "Failed to get quota" }
  }

  return {
    success: true,
    used: count ?? 0,
    limit: quota,
    isAdmin: false,
    plan: plan as PlanId,
    periodEnd: periodEnd?.toISOString() ?? null,
  }
}
