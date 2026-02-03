# Architecture Research

**Domain:** SaaS AI Thumbnail Generation (Next.js 15 + External n8n Workflow)
**Researched:** 2026-02-03
**Overall Confidence:** HIGH

## Component Overview

The YouTube Thumbnail Factory requires a multi-component architecture where Next.js handles the user-facing application while an external n8n workflow manages the long-running AI generation (3-7 minutes).

### Major Components and Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Web Application** | User authentication, form handling, UI rendering, gallery display | Next.js 15 (App Router) |
| **API Layer** | Webhook handling, job creation, external service orchestration | Next.js Route Handlers |
| **Database** | User data, generation records, job status tracking | Supabase PostgreSQL |
| **Real-time Layer** | Status updates pushed to client | Supabase Realtime |
| **Auth System** | User authentication, session management | Supabase Auth |
| **Storage** | Generated thumbnail images | Supabase Storage |
| **Payments** | Subscription management, usage limits | Stripe |
| **AI Workflow** | Image generation orchestration (external) | n8n (existing) |

### Component Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APPLICATION                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   App Routes    │  │  Server Actions │  │  Route Handlers │  │
│  │  (pages, UI)    │  │  (mutations)    │  │  (webhooks)     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│  ┌─────────────────────────────┴────────────────────────────┐  │
│  │                    /lib/supabase                          │  │
│  │        (Server Client, Browser Client, Middleware)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Supabase    │     │     Stripe      │     │  n8n Workflow   │
│  (Auth, DB,   │     │   (Payments)    │     │  (AI Gen)       │
│   Storage,    │     │                 │     │                 │
│   Realtime)   │     │                 │     │                 │
└───────────────┘     └─────────────────┘     └─────────────────┘
```

## Data Flow

### Generation Request Flow (User → AI → Results)

```
1. USER SUBMITS FORM
   ├─ Form data: keywords, background images
   ├─ Next.js Server Action validates input
   └─ Checks user credits/subscription status

2. CREATE GENERATION RECORD
   ├─ Insert row in `generations` table
   │   status: 'pending', user_id, keywords, created_at
   └─ Return generation_id to client

3. TRIGGER n8n WORKFLOW
   ├─ POST to n8n webhook URL
   │   payload: { generation_id, keywords, background_images }
   └─ Respond immediately (don't wait for n8n)

4. CLIENT SUBSCRIBES TO STATUS
   ├─ Supabase Realtime subscription on `generations` table
   └─ WHERE id = generation_id

5. n8n PROCESSES (3-7 minutes)
   ├─ Fetches head images from Airtable
   ├─ Uploads images to Kie.ai
   ├─ Generates AI prompts via OpenRouter
   ├─ Creates generation tasks
   ├─ Polls until complete
   └─ Downloads generated images

6. n8n CALLS BACK
   ├─ POST /api/webhooks/n8n-callback
   │   payload: { generation_id, status, images[], error? }
   └─ Signature verification (shared secret)

7. CALLBACK HANDLER PROCESSES
   ├─ Verify webhook signature
   ├─ Download images to Supabase Storage
   ├─ Update `generations` table
   │   status: 'completed', image_urls[], completed_at
   └─ Row change triggers Realtime notification

8. CLIENT RECEIVES UPDATE
   ├─ Realtime subscription fires
   ├─ UI updates to show completed status
   └─ Gallery displays generated thumbnails
```

### Data Model (Simplified)

```sql
-- Core generation tracking table
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,

  -- Input data
  keywords TEXT NOT NULL,
  background_count INTEGER NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending: created, not yet sent to n8n
    -- processing: n8n received and working
    -- completed: all images generated
    -- failed: error occurred
    -- partial: some images generated, some failed

  -- Progress (optional, for granular updates)
  progress INTEGER DEFAULT 0, -- 0-100
  current_step TEXT,          -- "Uploading images", "Generating prompts", etc.

  -- Results
  image_urls TEXT[],          -- Array of Supabase Storage URLs
  prompt_count INTEGER,       -- Number of prompts generated

  -- Error tracking
  error_message TEXT,
  error_code TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,     -- When n8n picked it up
  completed_at TIMESTAMPTZ,

  -- Metadata
  credits_used INTEGER DEFAULT 0
);

-- Enable realtime for this table
ALTER TABLE generations REPLICA IDENTITY FULL;
```

## Async Job Pattern

### Recommended Pattern: Webhook Callback + Supabase Realtime

This architecture uses the **callback webhook pattern** because:

1. **n8n Already Supports It**: The existing n8n workflow can POST results to a callback URL
2. **No Polling Required on Server**: Client polls via Supabase Realtime, not our API
3. **Vercel-Friendly**: No long-running processes, fits serverless model
4. **Simple to Implement**: Standard HTTP webhook, no queue infrastructure needed

### Implementation Details

**1. Triggering the Job (Server Action)**

```typescript
// /app/actions/generations.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGeneration(formData: FormData) {
  const supabase = await createClient()

  // Validate user and credits
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check subscription/credits
  const canGenerate = await checkUserCredits(user.id)
  if (!canGenerate) throw new Error('Insufficient credits')

  // Create generation record
  const { data: generation, error } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      keywords: formData.get('keywords'),
      background_count: formData.getAll('backgrounds').length,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error

  // Trigger n8n workflow (fire and forget)
  await triggerN8nWorkflow({
    generation_id: generation.id,
    keywords: formData.get('keywords'),
    background_images: formData.getAll('backgrounds'),
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n-callback`
  })

  // Update status to processing
  await supabase
    .from('generations')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', generation.id)

  revalidatePath('/dashboard')
  return { generationId: generation.id }
}

async function triggerN8nWorkflow(payload: object) {
  const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Optional: Add auth header if n8n requires it
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`n8n trigger failed: ${response.statusText}`)
  }
}
```

**2. Callback Handler (Route Handler)**

```typescript
// /app/api/webhooks/n8n-callback/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Use service role client for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-n8n-signature')
    const body = await request.text()

    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const { generation_id, status, images, error } = payload

    if (status === 'completed' && images?.length > 0) {
      // Download images to Supabase Storage
      const imageUrls = await Promise.all(
        images.map((img: any, index: number) =>
          downloadToStorage(generation_id, img.url, index)
        )
      )

      // Update generation record
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          image_urls: imageUrls,
          prompt_count: images.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', generation_id)

    } else if (status === 'failed') {
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: error?.message || 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', generation_id)
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = crypto
    .createHmac('sha256', process.env.N8N_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

**3. Client-Side Status Subscription**

```typescript
// /components/GenerationStatus.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Generation } from '@/types'

export function GenerationStatus({ generationId }: { generationId: string }) {
  const [generation, setGeneration] = useState<Generation | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .single()
      .then(({ data }) => setGeneration(data))

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`generation-${generationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generations',
          filter: `id=eq.${generationId}`
        },
        (payload) => {
          setGeneration(payload.new as Generation)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [generationId, supabase])

  if (!generation) return <LoadingSpinner />

  return (
    <div>
      <StatusBadge status={generation.status} />
      {generation.status === 'processing' && (
        <ProgressIndicator step={generation.current_step} />
      )}
      {generation.status === 'completed' && (
        <ThumbnailGallery images={generation.image_urls} />
      )}
      {generation.status === 'failed' && (
        <ErrorMessage message={generation.error_message} />
      )}
    </div>
  )
}
```

### Alternative Patterns Considered

| Pattern | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Polling from Client** | Simple | Wasteful, slow updates | Not recommended |
| **Server-Sent Events (SSE)** | Real-time, unidirectional | Complex state management | Overkill here |
| **WebSocket (custom)** | Full duplex | Vercel limitations, complexity | Not needed |
| **Supabase Realtime** | Built-in, simple, reliable | Supabase dependency | **Recommended** |
| **Queue (Bull/Redis)** | Robust, retries | Extra infrastructure | Overkill for MVP |
| **Inngest/Trigger.dev** | Durable, retries | Another vendor | Consider for v2 |

## Build Order

Based on dependencies and the async flow, here is the recommended build order:

### Phase 1: Foundation (Week 1-2)

**Build first because everything depends on it:**

1. **Supabase Setup**
   - Create project
   - Configure auth providers
   - Set up database schema (`users`, `generations` tables)
   - Enable Realtime on `generations` table
   - Configure Storage bucket for thumbnails

2. **Next.js Project Structure**
   - Initialize Next.js 15 with App Router
   - Set up folder structure (see below)
   - Configure Supabase client utilities
   - Implement auth middleware

3. **Basic Auth Flow**
   - Sign up / Sign in pages
   - Auth middleware protection
   - User profile in Supabase

### Phase 2: Core Generation Flow (Week 2-3)

**Build the main feature path:**

4. **Generation Form**
   - Keywords input component
   - Background image upload (to Supabase Storage temporary)
   - Form validation

5. **Server Action + n8n Trigger**
   - Create generation record
   - Trigger n8n webhook
   - Handle immediate response

6. **Webhook Callback Handler**
   - POST `/api/webhooks/n8n-callback`
   - Signature verification
   - Image download to Storage
   - Generation record update

7. **Real-time Status Display**
   - Supabase Realtime subscription
   - Status component with loading/progress/complete states
   - Gallery display for completed generations

### Phase 3: Polish & Payments (Week 3-4)

8. **Dashboard**
   - Generation history list
   - Gallery view
   - Download functionality

9. **Stripe Integration**
   - Pricing page
   - Checkout flow
   - Webhook handler (`/api/webhooks/stripe`)
   - Credit system or subscription gates

10. **Error Handling & Edge Cases**
    - Retry logic
    - Timeout handling
    - User-friendly error messages

### Dependency Graph

```
                    ┌─────────────────┐
                    │ Supabase Setup  │
                    │ (Auth, DB, RT)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      ┌──────────────┐ ┌──────────┐ ┌──────────────┐
      │  Auth Flow   │ │ Database │ │   Storage    │
      │  (pages)     │ │ (schema) │ │  (buckets)   │
      └──────┬───────┘ └────┬─────┘ └──────┬───────┘
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                    ┌───────────────┐
                    │  Generation   │
                    │    Form       │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼                           ▼
      ┌───────────────┐           ┌───────────────┐
      │ Server Action │           │ Status        │
      │ (trigger n8n) │           │ Subscription  │
      └───────┬───────┘           └───────────────┘
              │
              ▼
      ┌───────────────┐
      │   Callback    │
      │   Handler     │
      └───────┬───────┘
              │
              ▼
      ┌───────────────┐
      │   Dashboard   │
      │   & Gallery   │
      └───────┬───────┘
              │
              ▼
      ┌───────────────┐
      │    Stripe     │
      │  Integration  │
      └───────────────┘
```

## File Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx             # Auth-specific layout (no sidebar)
│   │
│   ├── (dashboard)/               # Protected dashboard route group
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Main dashboard (generation history)
│   │   ├── generate/
│   │   │   └── page.tsx           # Generation form
│   │   ├── gallery/
│   │   │   └── page.tsx           # All generated thumbnails
│   │   ├── settings/
│   │   │   └── page.tsx           # User settings, subscription
│   │   └── layout.tsx             # Dashboard layout (with sidebar)
│   │
│   ├── (marketing)/               # Public marketing pages
│   │   ├── page.tsx               # Landing page
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── api/
│   │   └── webhooks/
│   │       ├── n8n-callback/
│   │       │   └── route.ts       # n8n completion callback
│   │       └── stripe/
│   │           └── route.ts       # Stripe payment events
│   │
│   ├── layout.tsx                 # Root layout
│   └── globals.css
│
├── components/
│   ├── ui/                        # Shadcn/UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── auth/                      # Auth-specific components
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── user-menu.tsx
│   │
│   ├── generation/                # Generation feature components
│   │   ├── generation-form.tsx    # Main form with keywords + upload
│   │   ├── generation-status.tsx  # Real-time status display
│   │   ├── thumbnail-gallery.tsx  # Grid of generated images
│   │   └── image-upload.tsx       # Background image uploader
│   │
│   ├── dashboard/                 # Dashboard components
│   │   ├── generation-list.tsx    # History of generations
│   │   ├── sidebar.tsx
│   │   └── stats-cards.tsx
│   │
│   └── layout/                    # Layout components
│       ├── header.tsx
│       ├── footer.tsx
│       └── navigation.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   ├── middleware.ts          # Auth middleware helper
│   │   └── admin.ts               # Service role client (webhooks)
│   │
│   ├── stripe/
│   │   ├── client.ts              # Stripe client setup
│   │   └── config.ts              # Price IDs, product config
│   │
│   ├── n8n/
│   │   └── client.ts              # n8n webhook trigger utility
│   │
│   └── utils.ts                   # General utilities (cn, etc.)
│
├── actions/                       # Server Actions
│   ├── auth.ts                    # Auth actions
│   ├── generations.ts             # Generation create/cancel
│   ├── stripe.ts                  # Checkout session creation
│   └── profile.ts                 # Profile updates
│
├── hooks/
│   ├── use-generation-status.ts   # Realtime subscription hook
│   ├── use-user.ts                # Current user hook
│   └── use-subscription.ts        # Subscription status hook
│
├── types/
│   ├── database.ts                # Supabase generated types
│   ├── generation.ts              # Generation-specific types
│   └── index.ts                   # Re-exports
│
└── middleware.ts                  # Next.js middleware (auth protection)
```

### Key File Explanations

| Path | Purpose |
|------|---------|
| `app/(dashboard)/layout.tsx` | Wraps all authenticated pages with sidebar, auth check |
| `app/api/webhooks/n8n-callback/route.ts` | Receives results from n8n, updates database |
| `lib/supabase/server.ts` | Creates Supabase client for Server Components/Actions |
| `lib/supabase/admin.ts` | Service role client for webhook handlers |
| `actions/generations.ts` | Server Actions for creating generations |
| `hooks/use-generation-status.ts` | Encapsulates Realtime subscription logic |
| `middleware.ts` | Protects `/dashboard/*` routes, redirects unauthenticated |

## Anti-Patterns to Avoid

### 1. Long-Running API Routes
**Problem:** Trying to wait for n8n completion in the API route.
**Consequence:** Vercel timeout after 10-300 seconds.
**Solution:** Fire-and-forget trigger, receive callback.

### 2. Client-Side Polling
**Problem:** `setInterval` to poll `/api/status` endpoint.
**Consequence:** Wasted resources, slow updates, poor UX.
**Solution:** Supabase Realtime subscriptions.

### 3. Storing Images in Database
**Problem:** Base64 images in PostgreSQL columns.
**Consequence:** Slow queries, bloated database, expensive.
**Solution:** Supabase Storage with URL references.

### 4. No Webhook Verification
**Problem:** Accepting any POST to callback URL.
**Consequence:** Security vulnerability, data corruption.
**Solution:** HMAC signature verification.

### 5. Mixing Auth Clients
**Problem:** Using browser client in Server Actions.
**Consequence:** Auth failures, security issues.
**Solution:** Use `createClient()` from appropriate module.

## Sources

**HIGH Confidence (Official Documentation):**
- [Next.js 15 after() function](https://nextjs.org/docs/app/api-reference/functions/after)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)

**MEDIUM Confidence (Verified Patterns):**
- [SaaS Architecture Patterns with Next.js](https://vladimirsiedykh.com/blog/saas-architecture-patterns-nextjs)
- [Next.js App Router Project Structure - MakerKit](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure)
- [Architecture for Next.js SaaS - MakerKit](https://makerkit.dev/docs/next-supabase/architecture/architecture)
- [Real-time Notifications with Supabase and Next.js](https://makerkit.dev/blog/tutorials/real-time-notifications-supabase-nextjs)
- [Next.js Folder Structure Best Practices 2026](https://www.codebydeep.com/blog/next-js-folder-structure-best-practices-for-scalable-applications-2026-guide)
- [Supabase Subscriptions in Next.js 15](https://dev.to/lra8dev/building-real-time-magic-supabase-subscriptions-in-nextjs-15-2kmp)

**Pattern References:**
- [Real-Time SSE in Next.js](https://javascript.plainenglish.io/real-time-updates-with-server-sent-events-sse-in-next-js-typescript-a-beginners-guide-d7bb3e932269)
- [Vercel Serverless Timeout Solutions](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts)
- [Long-Running Background Functions on Vercel](https://www.inngest.com/blog/vercel-long-running-background-functions)
- [Async Job Processing System Design](https://agilesnowball.com/blog/designing-an-asynchronous-job-processing-system-for-long-running-web-jobs)
