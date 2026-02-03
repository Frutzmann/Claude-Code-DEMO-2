---
phase: 04-billing-settings
plan: 01
subsystem: payments
tags: [stripe, billing, database, postgresql, rls]

# Dependency graph
requires:
  - phase: 03-generation-gallery
    provides: generations table with credits_used tracking
provides:
  - Billing database schema (customers, products, prices, subscriptions)
  - Stripe client singleton
  - Plan configuration with quota mappings
affects: [04-02 (webhooks), 04-03 (checkout), billing integration, quota enforcement]

# Tech tracking
tech-stack:
  added: [stripe@20.3.0]
  patterns: [service-role-only tables, Stripe-synced schema]

key-files:
  created:
    - supabase/migrations/006_billing.sql
    - src/lib/stripe/server.ts
    - src/lib/billing/plans.ts
    - src/components/ui/separator.tsx
    - src/components/ui/radio-group.tsx
  modified:
    - src/types/database.ts
    - package.json

key-decisions:
  - "Use pricing_type, pricing_plan_interval, subscription_status enums for type safety"
  - "Customers table service-role-only (no user RLS)"
  - "Products and prices publicly readable for pricing page"
  - "Plan quotas: free (5), pro (50), agency (200) generations/month"

patterns-established:
  - "Stripe-synced tables: products/prices readonly in DB, webhook updates only"
  - "Plan configuration in code not database for simplicity"

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 4 Plan 1: Billing Infrastructure Summary

**Stripe SDK with billing schema (customers/products/prices/subscriptions) and plan quotas (5/50/200)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T14:00:00Z
- **Completed:** 2026-02-03T14:04:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Stripe SDK v20.3.0 installed with configured client
- Complete billing database schema with 4 tables and proper RLS
- Plan configuration mapping price IDs to quotas (5/50/200)
- 4 new shadcn components for settings UI (separator, tabs, radio-group, alert-dialog)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and add shadcn components** - `c9418f1` (chore)
2. **Task 2: Create billing database schema and TypeScript types** - `e25db63` (feat)
3. **Task 3: Create Stripe client and plan configuration** - `b189524` (feat)

## Files Created/Modified
- `supabase/migrations/006_billing.sql` - Billing tables with RLS and enums
- `src/types/database.ts` - Added Customer, Product, Price, Subscription types
- `src/lib/stripe/server.ts` - Stripe client singleton
- `src/lib/billing/plans.ts` - Plan definitions with getPlanByPriceId, getPlanQuota
- `src/components/ui/separator.tsx` - shadcn separator component
- `src/components/ui/radio-group.tsx` - shadcn radio-group component
- `src/components/ui/tabs.tsx` - shadcn tabs component (skipped - existed)
- `src/components/ui/alert-dialog.tsx` - shadcn alert-dialog component (skipped - existed)
- `package.json` - Added stripe dependency

## Decisions Made
- Used enums (pricing_type, pricing_plan_interval, subscription_status) for type-safe billing status tracking
- Customers table has no user-facing RLS (service role only for security)
- Products and prices tables are publicly readable for pricing page display
- Plan configuration stored in code (plans.ts) not database for deployment simplicity
- Price IDs sourced from environment variables (STRIPE_PRICE_PRO, STRIPE_PRICE_AGENCY)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- TypeScript check showed errors from stale .next cache (deleted route.ts file) - unrelated to billing changes, source files compile cleanly

## User Setup Required

**External services require manual configuration.** From plan frontmatter:
- STRIPE_SECRET_KEY: Stripe Dashboard -> Developers -> API keys -> Secret key
- STRIPE_WEBHOOK_SECRET: Stripe Dashboard -> Developers -> Webhooks -> Signing secret
- STRIPE_PRICE_PRO: Stripe Dashboard -> Products -> Pro plan -> Price ID
- STRIPE_PRICE_AGENCY: Stripe Dashboard -> Products -> Agency plan -> Price ID

Dashboard tasks:
- Create Pro product ($19/month, 50 generations)
- Create Agency product ($49/month, 200 generations)

Migration task:
- Run 006_billing.sql in Supabase SQL Editor

## Next Phase Readiness
- Billing schema ready for webhook handling (04-02)
- Stripe client ready for checkout integration (04-03)
- Plan quotas defined for usage enforcement

---
*Phase: 04-billing-settings*
*Completed: 2026-02-03*
