---
phase: 03
plan: 02
subsystem: generation-backend
tags: [n8n, webhook, server-actions, validation]

requires:
  - 03-01 # Database schema for generations/thumbnails

provides:
  - n8n webhook trigger client
  - Generation server actions with quota
  - Callback webhook for n8n results

affects:
  - 03-03 # Form will use createGeneration
  - 03-04 # Gallery will display generated thumbnails

tech-stack:
  patterns:
    - Service role for server-to-server operations
    - FormData pattern for file upload URLs
    - HMAC signature verification (optional)

key-files:
  created:
    - src/lib/n8n/client.ts
    - src/lib/validations/generations.ts
    - src/actions/generations.ts
    - src/app/api/webhooks/n8n-callback/route.ts
  modified:
    - src/middleware.ts

decisions:
  - key: webhook-public-route
    choice: "Add /api/webhooks to PUBLIC_ROUTES"
    why: "n8n cannot authenticate with user cookies"
  - key: optional-hmac
    choice: "HMAC verification only if N8N_WEBHOOK_SECRET set"
    why: "Easy development, secure in production"
  - key: free-tier-quota
    choice: "5 generations/month placeholder"
    why: "Full quota system in Phase 4 (billing)"

metrics:
  duration: 3 min
  completed: 2026-02-03
---

# Phase 03 Plan 02: Backend Infrastructure Summary

Server actions for generation creation, n8n webhook client, and callback webhook route for receiving generation results.

## What Was Built

### n8n Client (src/lib/n8n/client.ts)
- `triggerN8nWorkflow(payload)` - Triggers n8n thumbnail generation workflow
- Formats payload to match existing n8n workflow structure (Keywords, Background Images)
- Includes generation_id and callback_url for result delivery

### Validation Schemas (src/lib/validations/generations.ts)
- `createGenerationSchema` - Zod schema for generation creation
- Constants: MAX_BACKGROUNDS (7), MAX_FILE_SIZE (5MB), ALLOWED_IMAGE_TYPES
- FREE_TIER_MONTHLY_QUOTA (5) - placeholder until billing Phase 4

### Server Actions (src/actions/generations.ts)
- `createBackgroundUploadUrls(count)` - Returns signed URLs for direct upload to backgrounds bucket
- `createGeneration(input)` - Creates generation record and triggers n8n workflow
- `getGenerationQuota()` - Returns used/limit for UI display
- Admin users (ADMIN_EMAIL) bypass quota check

### Callback Webhook (src/app/api/webhooks/n8n-callback/route.ts)
- POST handler receives results from n8n workflow
- Optional HMAC signature verification (N8N_WEBHOOK_SECRET)
- Downloads thumbnails from Kie.ai URLs
- Uploads to Supabase Storage (thumbnails bucket)
- Creates thumbnail records in database
- Updates generation status (completed/failed/partial)

### Middleware Update (src/middleware.ts)
- Added `/api/webhooks` to PUBLIC_ROUTES
- Allows server-to-server webhook calls without authentication

## Task Execution

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | n8n client and validation schemas | fe69e05 | n8n/client.ts, validations/generations.ts |
| 2 | Generation server actions | cb06cf2 | actions/generations.ts |
| 3 | n8n callback webhook route | f626fcd | api/webhooks/n8n-callback/route.ts, middleware.ts |

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

Before the generation flow works end-to-end:

1. **Set environment variables:**
   - `N8N_WEBHOOK_URL` - Your n8n workflow webhook URL
   - `N8N_WEBHOOK_SECRET` - (Optional) Shared secret for HMAC verification
   - `SUPABASE_SERVICE_ROLE_KEY` - Required for callback webhook to update database

2. **Create Supabase Storage buckets:**
   - `backgrounds` - Public bucket for background image uploads
   - `thumbnails` - Public bucket for generated thumbnail storage

3. **Run database migration:**
   - Execute `004_generations.sql` in Supabase SQL Editor (from 03-01)

4. **Enable Realtime:**
   - Enable Realtime publication for `generations` table in Supabase Dashboard

## API Reference

### Server Actions

```typescript
// Get signed upload URLs for backgrounds
const { urls, error } = await createBackgroundUploadUrls(3)
// urls = [{ path: "user-id/timestamp-0.jpg", signedUrl: "..." }, ...]

// Create generation and trigger n8n
const { generationId, error } = await createGeneration({
  portraitId: "uuid",
  keywords: "gaming; streaming; tech",
  backgroundPaths: ["user-id/timestamp-0.jpg", ...]
})

// Check quota
const { used, limit, isAdmin, error } = await getGenerationQuota()
```

### n8n Callback Payload

```typescript
POST /api/webhooks/n8n-callback
{
  "generation_id": "uuid",
  "status": "completed" | "failed" | "partial",
  "thumbnails": [{
    "image_url": "https://kie.ai/...",
    "prompt": "A gaming setup with...",
    "prompt_index": 0,
    "background_index": 0,
    "kie_task_id": "task-123",
    "status": "success"
  }]
}
```

## Next Phase Readiness

Ready for 03-03 (Generation Form UI):
- createBackgroundUploadUrls for upload flow
- createGeneration for form submission
- getGenerationQuota for UI quota display
- Generation ID returned for Realtime subscription
