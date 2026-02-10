# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SaaS web application (**YouTube Thumbnail Factory**) that lets YouTube creators generate AI-powered thumbnails. Users upload a portrait and background images, enter keywords, and the system orchestrates AI generation via an external n8n workflow (Gemini for prompts + Kie.ai for images). Results are displayed in a downloadable gallery.

**Workflow ID**: `bMn3cp0ene5sfdY3`

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm start            # Start production server
bash test.sh         # Test the n8n webhook (requires n8n in test mode)
npx shadcn@latest add <component>  # Add shadcn/ui components (New York style, Neutral base)
```

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first config, no tailwind.config.js) + shadcn/ui (New York style)
- **Auth/DB/Storage/Realtime**: Supabase (PostgreSQL with RLS, `@supabase/ssr`)
- **Payments**: Stripe (subscriptions + Customer Portal)
- **AI Pipeline**: External n8n workflow triggered via webhook
- **Animations**: Motion library (`motion/react`) for landing page
- **Forms**: React Hook Form + Zod + `@hookform/resolvers`
- **Deployment**: Vercel (standalone output mode)

## Architecture

### Route Groups

```
src/app/
  (auth)/       → Login, signup, forgot/reset password (unauthenticated only)
  (dashboard)/  → Dashboard, generate, gallery, gallery/[id], portraits, settings (authenticated)
  (onboarding)/ → Onboarding flow + welcome tutorial (authenticated, pre-onboarding)
  page.tsx      → Landing page (public, no auth redirect)
  api/webhooks/ → Stripe webhook + n8n callback (not yet implemented)
```

### Key Patterns

- **Server Component → Client Component split**: Server component fetches data, passes to client component for interactions. Dashboard pages use `page.tsx` (server) + `client.tsx` (client) pattern.
- **Server Actions** (`src/actions/`): All mutations go through server actions. Auth checks + Zod validation happen server-side.
- **Supabase clients**: Use `@/lib/supabase/server` in Server Components/Actions, `@/lib/supabase/client` in Client Components. Never mix them.
- **Admin detection**: Via `ADMIN_EMAIL` env var checked by `isAdmin()` in `src/lib/admin.ts`. Admin gets unlimited generations.
- **Middleware** (`src/middleware.ts`): Refreshes Supabase session, enforces auth on protected routes, redirects incomplete onboarding users to `/onboarding`.

### Generation Flow

```
User submits form → Server Action validates + checks quota
→ Creates generation record (status: 'pending')
→ Triggers n8n webhook (fire-and-forget)
→ Updates status to 'processing'
→ Client subscribes to Supabase Realtime on generations table
→ n8n inserts thumbnails directly into Supabase (service role)
→ Database trigger updates generation status/progress
→ Client receives Realtime update, displays results
```

### Billing

Three tiers defined in `src/lib/billing/plans.ts`:
- **Free**: 5 generations/month (calendar month)
- **Pro** ($19): 50 generations/month (Stripe billing period)
- **Agency** ($49): 200 generations/month (Stripe billing period)

Plan resolution uses Stripe price IDs from env vars (`STRIPE_PRICE_PRO`, `STRIPE_PRICE_AGENCY`).

### Database Tables

`profiles`, `portraits`, `generations`, `thumbnails`, `customers`, `products`, `prices`, `subscriptions` — types in `src/types/database.ts`.

Generations table has `REPLICA IDENTITY FULL` enabled for Supabase Realtime subscriptions.

## n8n Expression Syntax Warning

**CRITICAL**: n8n expressions (`={{ }}`) do NOT support optional chaining (`?.`). Always use ternary operators instead:
```
{{ $json.data?.taskId }}       ← WRONG
{{ $json.data ? $json.data.taskId : $json.taskId }}  ← CORRECT
```
Code nodes (JavaScript) DO support `?.`.

## Environment Variables

See `.env.example`. Key variables:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only, for webhook handlers that bypass RLS
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe server-side
- `STRIPE_PRICE_PRO`, `STRIPE_PRICE_AGENCY` — Stripe price IDs for plan resolution
- `N8N_WEBHOOK_URL` — n8n workflow trigger endpoint
- `ADMIN_EMAIL` — Admin user (unlimited generations)
- `NEXT_PUBLIC_APP_URL` — App base URL for redirects

## Known Issues

- Production build fails with `<Html> should not be imported` error due to radix-ui 1.4.3 + Next.js 15.3.1 compatibility. Dev server works fine.

## MCP Integration

n8n-mcp configured in `.mcp.json` for workflow management against `https://n8n.srv824812.hstgr.cloud`.

## External APIs

- **Kie.ai Upload**: `POST https://kieai.redpandaai.co/api/file-base64-upload`
- **Kie.ai Create Task**: `POST https://api.kie.ai/api/v1/jobs/createTask` (model: `nano-banana-pro`)
- **Kie.ai Poll Status**: `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}`

## Planning Documentation

Detailed planning docs exist in `.planning/` including architecture research, phase plans, and summaries. `STATE.md` tracks project state and accumulated decisions.
