import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

/**
 * Payload structure from n8n workflow callback
 */
interface N8nCallbackPayload {
  generation_id: string
  status: "completed" | "failed" | "partial"
  thumbnails?: Array<{
    image_url: string
    prompt: string
    prompt_index: number
    background_index: number
    kie_task_id: string
    status: "success" | "failed"
    error_message?: string
  }>
  error?: string
}

/**
 * Verify HMAC signature if secret is configured
 */
function verifySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET
  if (!secret) {
    // No secret configured, skip verification
    return true
  }

  if (!signature) {
    return false
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Download image from URL and return as buffer
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to download image from ${url}: ${response.status}`)
      return null
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error)
    return null
  }
}

/**
 * POST handler for n8n callback webhook
 *
 * This endpoint receives results from the n8n thumbnail generation workflow:
 * 1. Verifies HMAC signature (if secret is configured)
 * 2. Downloads generated thumbnail images from Kie.ai URLs
 * 3. Uploads thumbnails to Supabase Storage
 * 4. Creates thumbnail records in database
 * 5. Updates generation status
 */
export async function POST(request: NextRequest) {
  // Get raw body for signature verification
  const rawBody = await request.text()
  const signature = request.headers.get("x-webhook-signature")

  // Verify signature if secret is configured
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    )
  }

  // Parse payload
  let payload: N8nCallbackPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    )
  }

  // Validate required fields
  if (!payload.generation_id) {
    return NextResponse.json(
      { error: "Missing generation_id" },
      { status: 400 }
    )
  }

  // Create service role client for server-to-server operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase configuration")
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Verify generation exists
  const { data: generation, error: fetchError } = await supabase
    .from("generations")
    .select("id, user_id")
    .eq("id", payload.generation_id)
    .single()

  if (fetchError || !generation) {
    console.error(`Generation not found: ${payload.generation_id}`)
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 }
    )
  }

  // Handle failure case
  if (payload.status === "failed") {
    await supabase
      .from("generations")
      .update({
        status: "failed",
        error_message: payload.error ?? "Generation failed",
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq("id", payload.generation_id)

    return NextResponse.json({ success: true, message: "Failure recorded" })
  }

  // Process thumbnails
  const thumbnails = payload.thumbnails ?? []
  let successCount = 0
  let failCount = 0

  for (const thumbnail of thumbnails) {
    if (thumbnail.status === "failed") {
      // Record failed thumbnail
      await supabase.from("thumbnails").insert({
        generation_id: payload.generation_id,
        storage_path: "",
        public_url: "",
        prompt: thumbnail.prompt,
        prompt_index: thumbnail.prompt_index,
        background_index: thumbnail.background_index,
        kie_task_id: thumbnail.kie_task_id,
        status: "failed",
        error_message: thumbnail.error_message ?? "Generation failed",
      })
      failCount++
      continue
    }

    // Download image from Kie.ai
    const imageBuffer = await downloadImage(thumbnail.image_url)
    if (!imageBuffer) {
      // Record download failure
      await supabase.from("thumbnails").insert({
        generation_id: payload.generation_id,
        storage_path: "",
        public_url: "",
        prompt: thumbnail.prompt,
        prompt_index: thumbnail.prompt_index,
        background_index: thumbnail.background_index,
        kie_task_id: thumbnail.kie_task_id,
        status: "failed",
        error_message: "Failed to download generated image",
      })
      failCount++
      continue
    }

    // Upload to Supabase Storage
    const storagePath = `${generation.user_id}/${payload.generation_id}/${thumbnail.prompt_index}-${thumbnail.background_index}.jpg`

    const { error: uploadError } = await supabase.storage
      .from("thumbnails")
      .upload(storagePath, imageBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      })

    if (uploadError) {
      console.error(`Failed to upload thumbnail: ${uploadError.message}`)
      await supabase.from("thumbnails").insert({
        generation_id: payload.generation_id,
        storage_path: "",
        public_url: "",
        prompt: thumbnail.prompt,
        prompt_index: thumbnail.prompt_index,
        background_index: thumbnail.background_index,
        kie_task_id: thumbnail.kie_task_id,
        status: "failed",
        error_message: `Failed to store image: ${uploadError.message}`,
      })
      failCount++
      continue
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(storagePath)

    // Create thumbnail record
    await supabase.from("thumbnails").insert({
      generation_id: payload.generation_id,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      prompt: thumbnail.prompt,
      prompt_index: thumbnail.prompt_index,
      background_index: thumbnail.background_index,
      kie_task_id: thumbnail.kie_task_id,
      status: "success",
    })
    successCount++
  }

  // Determine final status
  let finalStatus: "completed" | "failed" | "partial"
  if (successCount === 0 && failCount > 0) {
    finalStatus = "failed"
  } else if (failCount > 0) {
    finalStatus = "partial"
  } else {
    finalStatus = "completed"
  }

  // Update generation record
  await supabase
    .from("generations")
    .update({
      status: finalStatus,
      progress: 100,
      thumbnail_count: successCount,
      completed_at: new Date().toISOString(),
      error_message:
        failCount > 0 ? `${failCount} thumbnail(s) failed to generate` : null,
    })
    .eq("id", payload.generation_id)

  return NextResponse.json({
    success: true,
    message: `Processed ${successCount + failCount} thumbnails (${successCount} success, ${failCount} failed)`,
  })
}
