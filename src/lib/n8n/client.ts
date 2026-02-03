/**
 * n8n webhook client for triggering thumbnail generation workflows
 */

export interface TriggerPayload {
  generation_id: string
  portrait_url: string
  background_urls: string[]
  keywords: string
  callback_url: string
}

export interface N8nTriggerResponse {
  success: boolean
  message?: string
}

/**
 * Triggers the n8n thumbnail generation workflow.
 *
 * The payload is formatted to match the existing n8n workflow structure:
 * - Keywords: semicolon-separated keywords
 * - Background Images: array of {url, index} objects
 * - portrait_url: URL of the head/portrait image
 * - generation_id: our database ID for callback correlation
 * - callback_url: where n8n should POST results when done
 */
export async function triggerN8nWorkflow(payload: TriggerPayload): Promise<N8nTriggerResponse> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    throw new Error("N8N_WEBHOOK_URL not configured")
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      generation_id: payload.generation_id,
      Keywords: payload.keywords, // Match existing n8n workflow format
      portrait_url: payload.portrait_url,
      "Background Images": payload.background_urls.map((url, i) => ({
        url,
        index: i,
      })),
      callback_url: payload.callback_url,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`n8n trigger failed: ${response.status} - ${text}`)
  }

  // n8n may return various formats, handle gracefully
  const contentType = response.headers.get("content-type")
  if (contentType?.includes("application/json")) {
    return response.json()
  }

  return { success: true }
}
