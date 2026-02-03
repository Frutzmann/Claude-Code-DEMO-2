# Phase 3: Generation & Gallery - Research

**Researched:** 2026-02-03
**Domain:** Async Job Processing with n8n + Supabase Realtime + Gallery UI
**Confidence:** HIGH

## Summary

This research covers implementing the thumbnail generation form, webhook triggering to n8n, real-time progress tracking via Supabase Realtime, and a gallery for viewing/downloading generated thumbnails. The phase implements requirements GENR-01 through GENR-08, GALR-01 through GALR-05, and ADMN-02.

The architecture follows the **callback webhook pattern** already established in the project's ARCHITECTURE.md research:
1. User submits generation form (portrait + up to 7 backgrounds + keywords)
2. Server action validates inputs, checks quota, creates `generations` record in Supabase
3. Server action triggers existing n8n webhook with generation_id and callback URL
4. n8n responds immediately, client subscribes to Supabase Realtime on the generation record
5. n8n processes asynchronously (3-7 minutes), then POSTs results to callback route
6. Callback route updates `generations` table, triggering Realtime notification to client
7. Client shows completed thumbnails in gallery with download options

**Key insight:** The n8n workflow already exists and stores results in Airtable. For Phase 3, we adapt it to:
- Accept portrait URL from Supabase Storage (not Airtable)
- POST callback to `/api/webhooks/n8n-callback` with results
- The n8n workflow modification is Phase 6's scope; Phase 3 builds the frontend assuming the callback pattern

**Primary recommendation:** Create `generations` and `thumbnails` tables in Supabase, implement Realtime subscription for progress updates, use JSZip for batch downloads, and use signed upload URLs for background images to bypass Vercel's 5MB body limit.

## Standard Stack

The established libraries/tools for this phase:

### Core (Already in Project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.49.1 | Database, Storage, Realtime | Already in use, unified SDK |
| `@supabase/ssr` | ^0.6.1 | Server-side Supabase client | Already in use, SSR-ready |
| `next/image` | 15.3.1 | Optimized image display | Built-in, handles thumbnails efficiently |
| `lucide-react` | ^0.474.0 | Icons (Download, Image, Play, Check, X) | Already in use |
| `sonner` | ^2.0.7 | Toast notifications | Already in use for feedback |
| `zod` | ^3.24.2 | Schema validation | Already in use |
| `react-hook-form` | ^7.54.2 | Form state management | Already in use |
| `@hookform/resolvers` | ^5.0.1 | Zod resolver for RHF | Already in use |

### New Dependencies Required

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jszip` | ^3.10.1 | Client-side ZIP creation | Batch download of all thumbnails |
| `file-saver` | ^2.0.5 | Trigger file downloads | Save generated ZIP to disk |

### New shadcn/ui Components Needed

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `Progress` | Generation progress bar | Show 0-100% during processing |
| `Tabs` | Gallery view organization | Past generations list / current generation |
| `Tooltip` | Action button hints | Download, view details hints |
| `DropdownMenu` | Generation actions | Download all, view details |
| `Select` | Portrait selection in form | Choose from portrait library |

### Installation

```bash
# New dependencies
npm install jszip file-saver
npm install -D @types/file-saver

# New shadcn/ui components
npx shadcn@latest add progress tabs tooltip dropdown-menu select
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── generate/
│   │   │   ├── page.tsx           # Server: fetch portraits, check quota
│   │   │   └── client.tsx         # Client: generation form + realtime status
│   │   └── gallery/
│   │       ├── page.tsx           # Server: fetch generations list
│   │       ├── client.tsx         # Client: generations list with expand
│   │       └── [id]/
│   │           ├── page.tsx       # Server: fetch single generation
│   │           └── client.tsx     # Client: thumbnail grid + downloads
│   └── api/
│       └── webhooks/
│           └── n8n-callback/
│               └── route.ts       # POST handler for n8n results
├── actions/
│   └── generations.ts             # Server actions: create, cancel
├── components/
│   └── generation/
│       ├── generation-form.tsx    # Form with portrait, backgrounds, keywords
│       ├── generation-status.tsx  # Realtime status display
│       ├── background-upload.tsx  # Multi-image uploader (up to 7)
│       ├── portrait-selector.tsx  # Select from portrait library
│       ├── thumbnail-grid.tsx     # Display generated thumbnails
│       └── download-button.tsx    # Individual + batch download
├── hooks/
│   └── use-generation-status.ts   # Realtime subscription hook
└── lib/
    ├── validations/
    │   └── generations.ts         # Zod schemas for generation
    └── n8n/
        └── client.ts              # n8n webhook trigger utility
```

### Pattern 1: Database Schema for Generations

**What:** Two tables to track generation jobs and resulting thumbnails.
**When to use:** All generation and gallery features.

```sql
-- Generations table: tracks the overall generation job
CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Input data
  portrait_id UUID REFERENCES portraits(id) ON DELETE SET NULL,
  portrait_url TEXT NOT NULL,           -- Snapshot at generation time
  keywords TEXT NOT NULL,
  background_count INTEGER NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending: created, awaiting n8n
    -- processing: n8n acknowledged, generating
    -- completed: all thumbnails generated
    -- failed: error occurred
    -- partial: some thumbnails succeeded, some failed

  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,                    -- "Generating prompts...", "Creating thumbnails..."

  -- Results
  thumbnail_count INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Quota tracking
  credits_used INTEGER DEFAULT 1        -- 1 credit per generation
);

-- Thumbnails table: stores individual generated images
CREATE TABLE thumbnails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE NOT NULL,

  -- Image data
  storage_path TEXT NOT NULL,           -- Path in 'thumbnails' bucket
  public_url TEXT NOT NULL,             -- Public URL for display

  -- Metadata from n8n
  prompt TEXT,                          -- AI-generated prompt used
  prompt_index INTEGER,                 -- Which prompt (0-4)
  background_index INTEGER,             -- Which background image (0-6)
  kie_task_id TEXT,                     -- External task ID for debugging

  -- Status
  status TEXT DEFAULT 'success',        -- success, failed
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnails ENABLE ROW LEVEL SECURITY;

-- RLS policies for generations
CREATE POLICY "Users can read own generations"
ON generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
ON generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No direct UPDATE from users; updates come from service role via callback
CREATE POLICY "Service role can update generations"
ON generations FOR UPDATE
USING (true)
WITH CHECK (true);

-- RLS policies for thumbnails
CREATE POLICY "Users can read own thumbnails"
ON thumbnails FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM generations g
    WHERE g.id = thumbnails.generation_id
    AND g.user_id = auth.uid()
  )
);

-- Thumbnails inserted by service role via callback
CREATE POLICY "Service role can insert thumbnails"
ON thumbnails FOR INSERT
WITH CHECK (true);

-- Indexes
CREATE INDEX generations_user_id_idx ON generations(user_id);
CREATE INDEX generations_status_idx ON generations(status);
CREATE INDEX thumbnails_generation_id_idx ON thumbnails(generation_id);

-- Enable Realtime for generations table
ALTER TABLE generations REPLICA IDENTITY FULL;

-- Trigger for updated_at (reuse existing function)
CREATE TRIGGER generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Pattern 2: Supabase Realtime Subscription for Progress

**What:** Subscribe to generation record changes for real-time UI updates.
**When to use:** After submitting generation form, while waiting for completion.

```typescript
// hooks/use-generation-status.ts
"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

type Generation = Database["public"]["Tables"]["generations"]["Row"]

interface UseGenerationStatusOptions {
  generationId: string
  onComplete?: (generation: Generation) => void
  onError?: (error: string) => void
}

export function useGenerationStatus({
  generationId,
  onComplete,
  onError,
}: UseGenerationStatusOptions) {
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchGeneration = async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("id", generationId)
        .single()

      if (error) {
        console.error("Error fetching generation:", error)
        onError?.(error.message)
      } else {
        setGeneration(data)
        if (data.status === "completed") {
          onComplete?.(data)
        }
      }
      setIsLoading(false)
    }

    fetchGeneration()

    // Subscribe to Realtime updates
    const channel = supabase
      .channel(`generation-${generationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "generations",
          filter: `id=eq.${generationId}`,
        },
        (payload) => {
          const updated = payload.new as Generation
          setGeneration(updated)

          if (updated.status === "completed") {
            onComplete?.(updated)
          } else if (updated.status === "failed") {
            onError?.(updated.error_message || "Generation failed")
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [generationId, supabase, onComplete, onError])

  return { generation, isLoading }
}
```

### Pattern 3: n8n Webhook Trigger with Callback URL

**What:** Fire-and-forget trigger to n8n with callback URL for results.
**When to use:** After creating generation record in database.

```typescript
// lib/n8n/client.ts
interface TriggerPayload {
  generation_id: string
  portrait_url: string
  background_urls: string[]
  keywords: string
  callback_url: string
}

export async function triggerN8nWorkflow(payload: TriggerPayload) {
  const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Optional: Add auth header if n8n requires it
      // "Authorization": `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
    },
    body: JSON.stringify({
      // Map to n8n expected format (based on existing workflow)
      generation_id: payload.generation_id,
      Keywords: payload.keywords,
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

  return response.json()
}
```

### Pattern 4: Background Image Upload with Signed URLs

**What:** Generate signed upload URLs server-side, upload client-side to bypass body limits.
**When to use:** Uploading up to 7 background images before generation.

```typescript
// actions/generations.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function createBackgroundUploadUrls(count: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Use admin client for signed URL creation
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const urls: { path: string; signedUrl: string; token: string }[] = []

  for (let i = 0; i < count; i++) {
    const path = `${user.id}/backgrounds/${crypto.randomUUID()}`

    const { data, error } = await adminClient.storage
      .from("backgrounds")
      .createSignedUploadUrl(path)

    if (error) {
      console.error("Signed URL error:", error)
      return { error: "Failed to create upload URL" }
    }

    urls.push({
      path,
      signedUrl: data.signedUrl,
      token: data.token,
    })
  }

  return { urls }
}

// Client-side upload using signed URL
// components/generation/background-upload.tsx
async function uploadToSignedUrl(
  file: File,
  signedUrl: string,
  token: string
) {
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error("Upload failed")
  }

  return true
}
```

### Pattern 5: Callback Route Handler

**What:** Receive results from n8n, update database, store thumbnails in Supabase.
**When to use:** n8n workflow completion.

```typescript
// app/api/webhooks/n8n-callback/route.ts
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Use service role for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface N8nCallbackPayload {
  generation_id: string
  status: "completed" | "failed" | "partial"
  thumbnails?: Array<{
    image_url: string          // URL from Kie.ai
    prompt: string
    prompt_index: number
    background_index: number
    kie_task_id: string
    status: "success" | "failed"
    error_message?: string
  }>
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify webhook signature
    const signature = request.headers.get("x-n8n-signature")
    const body = await request.text()

    if (process.env.N8N_WEBHOOK_SECRET && signature) {
      const expected = crypto
        .createHmac("sha256", process.env.N8N_WEBHOOK_SECRET)
        .update(body)
        .digest("hex")

      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const payload: N8nCallbackPayload = JSON.parse(body)
    const { generation_id, status, thumbnails, error } = payload

    if (status === "completed" && thumbnails?.length) {
      // Download thumbnails to Supabase Storage and create records
      const thumbnailRecords = await Promise.all(
        thumbnails.map(async (thumb, index) => {
          // Download from Kie.ai
          const imageResponse = await fetch(thumb.image_url)
          const imageBlob = await imageResponse.blob()

          // Upload to Supabase Storage
          const storagePath = `${generation_id}/${index}.png`
          const { error: uploadError } = await supabase.storage
            .from("thumbnails")
            .upload(storagePath, imageBlob, {
              contentType: "image/png",
              upsert: true,
            })

          if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return null
          }

          const { data: { publicUrl } } = supabase.storage
            .from("thumbnails")
            .getPublicUrl(storagePath)

          return {
            generation_id,
            storage_path: storagePath,
            public_url: publicUrl,
            prompt: thumb.prompt,
            prompt_index: thumb.prompt_index,
            background_index: thumb.background_index,
            kie_task_id: thumb.kie_task_id,
            status: thumb.status,
            error_message: thumb.error_message,
          }
        })
      )

      // Insert thumbnail records
      const validRecords = thumbnailRecords.filter(Boolean)
      if (validRecords.length > 0) {
        await supabase.from("thumbnails").insert(validRecords)
      }

      // Update generation status
      await supabase
        .from("generations")
        .update({
          status: "completed",
          thumbnail_count: validRecords.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation_id)

    } else if (status === "failed") {
      await supabase
        .from("generations")
        .update({
          status: "failed",
          error_message: error || "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation_id)
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error("Webhook error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
```

### Pattern 6: Batch Download with JSZip

**What:** Download all thumbnails from a generation as a ZIP file.
**When to use:** "Download All" button in gallery.

```typescript
// components/generation/download-button.tsx
"use client"

import { useState } from "react"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Thumbnail {
  id: string
  public_url: string
  prompt_index: number
  background_index: number
}

interface DownloadAllButtonProps {
  thumbnails: Thumbnail[]
  generationId: string
}

export function DownloadAllButton({ thumbnails, generationId }: DownloadAllButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadAll = async () => {
    if (thumbnails.length === 0) return

    setIsDownloading(true)

    try {
      const zip = new JSZip()
      const folder = zip.folder("thumbnails")

      const downloads = thumbnails.map(async (thumb, index) => {
        const response = await fetch(thumb.public_url)
        const blob = await response.blob()
        const filename = `thumbnail_${thumb.prompt_index + 1}_bg${thumb.background_index + 1}.png`
        folder?.file(filename, blob)
      })

      await Promise.all(downloads)

      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `thumbnails-${generationId.slice(0, 8)}.zip`)

      toast.success("Download started")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download thumbnails")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button onClick={handleDownloadAll} disabled={isDownloading}>
      {isDownloading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Creating ZIP...
        </>
      ) : (
        <>
          <Download className="size-4" />
          Download All
        </>
      )}
    </Button>
  )
}
```

### Anti-Patterns to Avoid

- **Long-running API routes for n8n processing:** Vercel times out at 10-60 seconds. Use callback pattern, not polling.
- **Client-side polling for status:** Wastes resources, slow updates. Use Supabase Realtime subscriptions.
- **Uploading large images through server actions:** 1MB default limit, 5MB Vercel limit. Use signed upload URLs.
- **Storing thumbnails as base64 in database:** Bloats database, slow queries. Use Supabase Storage with URL references.
- **No webhook signature verification:** Security risk. Implement HMAC verification.
- **Subscribing to entire table changes:** Performance bottleneck. Filter by specific `id=eq.{id}`.
- **Forgetting to unsubscribe Realtime channels:** Memory leaks. Always cleanup in useEffect return.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP file creation | Manual archive building | `jszip` + `file-saver` | Browser compatibility, streaming, edge cases |
| Real-time updates | setInterval polling | Supabase Realtime | WebSocket-based, efficient, built-in |
| Progress indicators | Custom SVG animation | shadcn/ui Progress | Accessible, consistent, animated |
| Image upload queue | Manual File API | Signed URLs pattern | Bypasses body limits, direct to storage |
| Webhook security | Basic API key check | HMAC signature verification | Prevents replay attacks, timing-safe |
| Form validation | Manual checks | Zod + react-hook-form | Already in project, type-safe |

**Key insight:** The async job processing pattern is fully supported by the existing stack. Supabase Realtime + service role callback is the blessed approach for Next.js/Vercel deployments.

## Common Pitfalls

### Pitfall 1: Vercel Timeout on Long Processes

**What goes wrong:** Trying to wait for n8n completion in API route, Vercel times out.
**Why it happens:** Serverless functions have 10-60 second limits; generation takes 3-7 minutes.
**How to avoid:**
1. Fire-and-forget pattern: POST to n8n, return immediately
2. n8n calls back when complete
3. Client uses Realtime, not polling
**Warning signs:** 504 Gateway Timeout errors in production.

### Pitfall 2: Realtime Subscription Not Receiving Updates

**What goes wrong:** Client subscribes but never receives updates.
**Why it happens:** Table not added to `supabase_realtime` publication, or RLS blocks access.
**How to avoid:**
1. Add table to publication: `ALTER TABLE generations REPLICA IDENTITY FULL;`
2. Enable in Supabase Dashboard: Database > Publications > supabase_realtime > toggle table
3. Ensure RLS policy allows SELECT for the user
**Warning signs:** Initial fetch works, but no updates arrive after n8n callback.

### Pitfall 3: Callback Route Not Accessible

**What goes wrong:** n8n cannot reach `/api/webhooks/n8n-callback`.
**Why it happens:** Route protected by auth middleware, or Vercel function error.
**How to avoid:**
1. Exclude webhook routes from auth middleware matcher
2. In `middleware.ts`: `config.matcher = ["/((?!api/webhooks)...)"]`
3. Use signature verification instead of auth for security
**Warning signs:** n8n logs show 401/403 errors, generations stuck in "processing".

### Pitfall 4: Large Background Images Failing Upload

**What goes wrong:** Users upload 5+ MB images, upload fails or times out.
**Why it happens:** Server action body limit (1MB) or Vercel limit (5MB).
**How to avoid:**
1. Use signed upload URLs (client uploads directly to Supabase)
2. Validate file size client-side before upload (5MB max)
3. Consider client-side image compression (optional enhancement)
**Warning signs:** "Request Entity Too Large" errors, failed uploads for large files.

### Pitfall 5: Missing Admin Quota Bypass

**What goes wrong:** Admin user blocked by quota check.
**Why it happens:** Quota check doesn't check `isAdmin()` first.
**How to avoid:**
```typescript
const userEmail = user.email
const adminBypass = isAdmin(userEmail)

if (!adminBypass) {
  // Check quota
  const { count } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth)

  if (count && count >= quotaLimit) {
    return { error: "Monthly quota exceeded" }
  }
}
```
**Warning signs:** Admin (ADMIN_EMAIL) gets "quota exceeded" error.

### Pitfall 6: n8n Workflow Expects Different Payload Format

**What goes wrong:** n8n returns errors because payload doesn't match expected format.
**Why it happens:** Existing workflow expects Airtable-style payload with base64 images.
**How to avoid:**
1. Phase 3: Send payload in format n8n currently expects OR
2. Phase 6: Modify n8n to accept new format
3. Document expected format clearly in CLAUDE.md
**Warning signs:** n8n workflow fails at first node, parsing errors in logs.

## Code Examples

### Generation Form Component

```typescript
// components/generation/generation-form.tsx
"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createGeneration } from "@/actions/generations"
import { BackgroundUpload } from "./background-upload"
import { Loader2, Sparkles } from "lucide-react"

const formSchema = z.object({
  portraitId: z.string().uuid("Select a portrait"),
  keywords: z.string().min(3, "Enter at least 3 characters").max(500),
})

type FormData = z.infer<typeof formSchema>

interface Portrait {
  id: string
  public_url: string
  label: string
  is_active: boolean
}

interface GenerationFormProps {
  portraits: Portrait[]
  isAdmin: boolean
  quota: { used: number; limit: number } | null
  onGenerationStarted: (generationId: string) => void
}

export function GenerationForm({
  portraits,
  isAdmin,
  quota,
  onGenerationStarted,
}: GenerationFormProps) {
  const [isPending, startTransition] = useTransition()
  const [backgroundFiles, setBackgroundFiles] = useState<File[]>([])

  const activePortrait = portraits.find((p) => p.is_active)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      portraitId: activePortrait?.id || "",
      keywords: "",
    },
  })

  const quotaExceeded = !isAdmin && quota && quota.used >= quota.limit

  const onSubmit = (data: FormData) => {
    if (backgroundFiles.length === 0) {
      toast.error("Upload at least one background image")
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set("portraitId", data.portraitId)
      formData.set("keywords", data.keywords)
      backgroundFiles.forEach((file, i) => {
        formData.append("backgrounds", file)
      })

      const result = await createGeneration(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Generation started!")
      onGenerationStarted(result.generationId!)
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Quota display */}
      {isAdmin ? (
        <div className="text-sm text-muted-foreground">
          Admin - Unlimited generations
        </div>
      ) : quota ? (
        <div className="text-sm text-muted-foreground">
          {quota.used} / {quota.limit} generations this month
          {quotaExceeded && (
            <span className="text-destructive ml-2">
              Quota exceeded. Upgrade to continue.
            </span>
          )}
        </div>
      ) : null}

      {/* Portrait selector */}
      <div className="space-y-2">
        <Label>Portrait</Label>
        <Select
          value={form.watch("portraitId")}
          onValueChange={(v) => form.setValue("portraitId", v)}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a portrait" />
          </SelectTrigger>
          <SelectContent>
            {portraits.map((portrait) => (
              <SelectItem key={portrait.id} value={portrait.id}>
                {portrait.label || "Untitled"} {portrait.is_active && "(Active)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Background upload */}
      <div className="space-y-2">
        <Label>Background Images (up to 7)</Label>
        <BackgroundUpload
          files={backgroundFiles}
          onFilesChange={setBackgroundFiles}
          maxFiles={7}
          disabled={isPending}
        />
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <Label>Keywords</Label>
        <Input
          {...form.register("keywords")}
          placeholder="automation, n8n, tutorial, productivity..."
          disabled={isPending}
        />
        {form.formState.errors.keywords && (
          <p className="text-sm text-destructive">
            {form.formState.errors.keywords.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || quotaExceeded}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Starting generation...
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Generate Thumbnails
          </>
        )}
      </Button>
    </form>
  )
}
```

### Generation Status Component

```typescript
// components/generation/generation-status.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useGenerationStatus } from "@/hooks/use-generation-status"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"

interface GenerationStatusProps {
  generationId: string
}

export function GenerationStatus({ generationId }: GenerationStatusProps) {
  const router = useRouter()

  const { generation, isLoading } = useGenerationStatus({
    generationId,
    onComplete: (gen) => {
      toast.success(`Generated ${gen.thumbnail_count} thumbnails!`)
      router.push(`/gallery/${generationId}`)
    },
    onError: (error) => {
      toast.error(error)
    },
  })

  if (isLoading || !generation) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const statusConfig = {
    pending: { icon: Clock, label: "Queued", color: "text-muted-foreground" },
    processing: { icon: Loader2, label: "Generating", color: "text-primary" },
    completed: { icon: CheckCircle, label: "Complete", color: "text-green-500" },
    failed: { icon: XCircle, label: "Failed", color: "text-destructive" },
    partial: { icon: CheckCircle, label: "Partial Success", color: "text-yellow-500" },
  }

  const config = statusConfig[generation.status as keyof typeof statusConfig]
  const Icon = config?.icon || Clock

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`size-5 ${config?.color} ${generation.status === "processing" ? "animate-spin" : ""}`} />
          {config?.label || generation.status}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {generation.status === "processing" && (
          <>
            <Progress value={generation.progress || 0} />
            <p className="text-sm text-muted-foreground">
              {generation.current_step || "Processing..."}
            </p>
          </>
        )}

        {generation.status === "failed" && (
          <p className="text-sm text-destructive">
            {generation.error_message || "An error occurred during generation."}
          </p>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p>Keywords: {generation.keywords}</p>
          <p>Backgrounds: {generation.background_count}</p>
          {generation.thumbnail_count > 0 && (
            <p>Generated: {generation.thumbnail_count} thumbnails</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### Gallery List Component

```typescript
// components/generation/gallery-list.tsx
"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Image, Clock, CheckCircle, XCircle, ChevronRight } from "lucide-react"

interface Generation {
  id: string
  keywords: string
  background_count: number
  thumbnail_count: number
  status: string
  created_at: string
  portrait_url: string
}

interface GalleryListProps {
  generations: Generation[]
}

export function GalleryList({ generations }: GalleryListProps) {
  if (generations.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No generations yet.</p>
        <Button asChild className="mt-4">
          <Link href="/generate">Create your first thumbnails</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {generations.map((gen) => (
        <Link key={gen.id} href={`/gallery/${gen.id}`}>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              {/* Thumbnail preview */}
              <div className="size-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                <Image className="size-8 text-muted-foreground" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{gen.keywords}</p>
                <p className="text-sm text-muted-foreground">
                  {gen.thumbnail_count} thumbnails from {gen.background_count} backgrounds
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                </p>
              </div>

              {/* Status badge */}
              <Badge
                variant={
                  gen.status === "completed"
                    ? "default"
                    : gen.status === "failed"
                    ? "destructive"
                    : "secondary"
                }
              >
                {gen.status === "completed" && <CheckCircle className="size-3 mr-1" />}
                {gen.status === "failed" && <XCircle className="size-3 mr-1" />}
                {gen.status === "processing" && <Clock className="size-3 mr-1" />}
                {gen.status}
              </Badge>

              <ChevronRight className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client polling API every 5s | Supabase Realtime subscriptions | Supabase Realtime GA (2023) | Instant updates, no wasted requests |
| Base64 images in webhook body | URL references + Storage | Best practice for scale | Smaller payloads, faster processing |
| Airtable for storage | Supabase Storage | Project decision | Unified platform, better RLS |
| Sync webhook wait | Callback pattern | Serverless constraints | Works within Vercel timeouts |

**Deprecated/outdated:**
- `setInterval` for status polling: Use Realtime subscriptions
- Direct n8n database writes: Use callback webhook for decoupling
- FormData with large files to server: Use signed upload URLs

## Open Questions

Things that couldn't be fully resolved:

1. **n8n Workflow Payload Format**
   - What we know: Current workflow expects `{ Keywords: "...", "Background Images": [{ filename, data, mimeType }] }`
   - What's unclear: Will n8n accept URLs instead of base64? Will callback be added?
   - Recommendation: Phase 3 builds assuming callback works. Phase 6 modifies n8n workflow.

2. **Progress Updates from n8n**
   - What we know: n8n can't easily send progress updates mid-workflow
   - What's unclear: How granular should progress be?
   - Recommendation: Simple 0/50/100 progress (pending/processing/completed). No mid-workflow updates for MVP.

3. **Thumbnail Storage Cleanup**
   - What we know: Thumbnails stored in Supabase Storage indefinitely
   - What's unclear: Should old thumbnails be cleaned up? Retention policy?
   - Recommendation: Keep all for MVP. Consider storage costs in v2.

4. **Rate Limiting n8n Triggers**
   - What we know: Users could spam generation requests
   - What's unclear: Should there be a cooldown beyond quota?
   - Recommendation: Quota is sufficient for MVP. Add rate limiting if abuse detected.

## Sources

### Primary (HIGH confidence)
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) - Row-level subscriptions, filter syntax
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) - Integration patterns
- [Supabase Storage createSignedUploadUrl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) - Signed URL pattern
- [n8n Webhook Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) - Webhook configuration
- [n8n HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/) - Callback pattern

### Secondary (MEDIUM confidence)
- [Building Real-time Magic: Supabase Subscriptions in Next.js 15](https://dev.to/lra8dev/building-real-time-magic-supabase-subscriptions-in-nextjs-15-2kmp) - Implementation patterns
- [Signed URL file uploads with Next.js and Supabase](https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0) - Body size bypass
- [How to Generate ZIP with File Links in Next JS](https://www.mridul.tech/blogs/how-to-generate-zip-with-file-links-in-next-js-and-react-js) - JSZip pattern
- [Downloading remote images as a zip file using JSZip](https://dev.to/sparshed/downloading-remote-images-as-a-zip-file-using-jszip-2kp4) - Batch download

### Tertiary (LOW confidence)
- WebSearch patterns for HMAC verification - standard crypto patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies + official patterns
- Architecture: HIGH - Callback pattern validated in ARCHITECTURE.md research
- Database schema: HIGH - Based on existing portraits schema pattern
- Realtime integration: HIGH - Official Supabase documentation
- n8n integration: MEDIUM - Existing workflow, callback modification needed in Phase 6
- Batch download: MEDIUM - Community patterns, well-established libraries

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable patterns, established libraries)
