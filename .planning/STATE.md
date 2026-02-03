# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Users can generate high-quality YouTube thumbnails without design skills
**Current focus:** Phase 4 - Billing & Settings

## Current Position

Phase: 4 of 5 (Billing & Settings)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-03 — Completed 04-01-PLAN.md

Progress: [███████░░░] 67%

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: 3.5 min
- Total execution time: 39 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 4 | 19 min | 4.75 min |
| 2 | 2 | 4 min | 2 min |
| 3 | 4 | 12 min | 3 min |
| 4 | 1 | 4 min | 4 min |

**Recent Trend:**
- Last 5 plans: 03-01 (2m), 03-02 (3m), 03-03 (3m), 03-04 (4m), 04-01 (4m)
- Trend: Steady

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pinned Next.js to 15.3.1 due to build conflicts with parent lockfile
- Used New York shadcn style with Neutral base color
- Dark theme set as default with system preference support
- Admin identified by ADMIN_EMAIL env var (not database flag)
- Profiles table uses UUID from auth.users as primary key
- Portraits bucket is public for n8n workflow access
- Callback route is public for email verification
- Forms use FormData pattern with server actions
- Onboarding is 2-step: portrait upload then welcome tutorial
- Dashboard sidebar items disabled with 'Soon' badge until implemented
- First portrait uploaded auto-activates for new users
- Storage deletion errors logged but don't block database deletion
- useOptimistic for immediate delete feedback in portrait grid
- Server component fetches data, client component handles interactions pattern
- Generations table uses TEXT status with CHECK constraint (not enum)
- Service role policies allow n8n callback to update generations/insert thumbnails
- REPLICA IDENTITY FULL on generations for Realtime subscriptions
- /api/webhooks added to PUBLIC_ROUTES for n8n callback
- Optional HMAC verification with N8N_WEBHOOK_SECRET
- Free tier quota set to 5 generations/month (placeholder for Phase 4)
- Supabase Realtime useRef pattern for stable callbacks in subscriptions
- JSZip + file-saver for batch thumbnail downloads
- date-fns for relative time formatting in gallery
- Billing enums (pricing_type, pricing_plan_interval, subscription_status) for type safety
- Customers table service-role-only (no user RLS)
- Plan quotas: free (5), pro (50), agency (200) generations/month

### Pending Todos

- Run 004_generations.sql in Supabase SQL Editor
- Enable Realtime publication for generations table in Supabase Dashboard
- Create 'backgrounds' storage bucket (public)
- Create 'thumbnails' storage bucket (public)
- Set N8N_WEBHOOK_URL environment variable
- Set SUPABASE_SERVICE_ROLE_KEY environment variable
- Run 006_billing.sql in Supabase SQL Editor
- Set STRIPE_SECRET_KEY environment variable
- Set STRIPE_WEBHOOK_SECRET environment variable
- Set STRIPE_PRICE_PRO environment variable
- Set STRIPE_PRICE_AGENCY environment variable
- Create Pro product ($19/month) in Stripe Dashboard
- Create Agency product ($49/month) in Stripe Dashboard

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-03T14:04:00Z
Stopped at: Completed 04-01-PLAN.md
Resume file: None

---
*Next step: Execute 04-02-PLAN.md (Stripe webhooks)*
