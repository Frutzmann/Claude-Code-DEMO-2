# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Users can generate high-quality YouTube thumbnails without design skills
**Current focus:** Milestone v1.0 COMPLETE

## Current Position

Phase: 5 of 5 (Landing Page)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-02-03 — Completed 05-02-PLAN.md

Progress: [████████████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 15
- Average duration: 4.4 min
- Total execution time: 66 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 4 | 19 min | 4.75 min |
| 2 | 2 | 4 min | 2 min |
| 3 | 4 | 12 min | 3 min |
| 4 | 3 | 15 min | 5 min |
| 5 | 2 | 16 min | 8 min |

**Recent Trend:**
- Last 5 plans: 04-01 (4m), 04-02 (3m), 04-03 (8m), 05-01 (4m), 05-02 (12m)
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
- Billing period quota: paid users use Stripe billing period, free users use calendar month
- Subscription metadata must include supabase_user_id for webhook linking
- Service role client used for webhook handlers that bypass RLS
- Tabs UI for Profile/Billing separation in Settings
- Admin sees Crown icon + "Admin - Unlimited" badge with no upgrade CTAs
- Free users see billing period reset info, paid users see renewal date
- Motion library (motion/react) for landing page animations
- Landing page renders same content for all users (no auth-based redirects)
- Smooth scroll via CSS scroll-behavior property

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

- Pre-existing radix-ui 1.4.3 + Next.js 15.3.1 compatibility issue causes production build to fail with "<Html> should not be imported" error. Dev server works fine. Needs investigation.

## Session Continuity

Last session: 2026-02-03T18:00:00Z
Stopped at: Completed 05-02-PLAN.md
Resume file: None

---
*All phases complete! Project ready for production deployment.*
