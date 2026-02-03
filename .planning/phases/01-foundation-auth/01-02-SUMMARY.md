---
phase: 01-foundation-auth
plan: 02
subsystem: database
tags: [supabase, auth, postgresql, rls, storage]

# Dependency graph
requires: []
provides:
  - Browser Supabase client for client components
  - Server Supabase client with cookie handling
  - Middleware session updater for route protection
  - Admin identification utility
  - Profiles table with auto-creation trigger
  - Storage RLS policies for portraits bucket
affects: [01-03-auth-flow, 01-04-onboarding, 02-portrait-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Three Supabase clients: browser, server, middleware"
    - "Cookie-based session management with @supabase/ssr"
    - "RLS policies for user data isolation"
    - "Database trigger for auto-creating profiles on signup"

key-files:
  created:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/middleware.ts
    - src/lib/admin.ts
    - supabase/migrations/001_profiles.sql
    - supabase/migrations/002_storage.sql
  modified: []

key-decisions:
  - "Admin identified by ADMIN_EMAIL env var (not database flag)"
  - "Profiles table uses UUID from auth.users as primary key"
  - "Portraits bucket is public for n8n workflow access"

patterns-established:
  - "Supabase client pattern: createClient() returns typed client"
  - "updateSession() returns { supabaseResponse, user, supabase }"
  - "Always use getUser() not getSession() in server code"

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 1 Plan 2: Supabase Setup Summary

**Supabase client utilities for browser/server/middleware with profiles table auto-creation trigger and storage RLS policies**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-03T10:21:05Z
- **Completed:** 2026-02-03T10:24:17Z
- **Tasks:** 2
- **Files created:** 9

## Accomplishments
- Three Supabase client utilities (browser, server, middleware) following official patterns
- Profiles table with onboarding_completed flag and auto-creation trigger
- Storage RLS policies allowing user uploads and public read for n8n workflow
- Admin check utility using environment variable

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase client utilities** - `9b2e700` (feat)
2. **Task 2: Create database migration files** - included in `f168d2f` (parallel agent)

Note: Task 2 files were committed by a parallel agent executing 01-01. Files were created correctly by this execution.

## Files Created/Modified
- `.env.example` - Environment variable template
- `.env.local` - Local environment file (gitignored)
- `.gitignore` - Standard Next.js gitignore
- `src/lib/supabase/client.ts` - Browser client using createBrowserClient
- `src/lib/supabase/server.ts` - Server client with async cookie handling
- `src/lib/supabase/middleware.ts` - updateSession helper for middleware
- `src/lib/admin.ts` - isAdmin() check against ADMIN_EMAIL env var
- `supabase/migrations/001_profiles.sql` - Profiles table, RLS, triggers
- `supabase/migrations/002_storage.sql` - Storage RLS for portraits bucket
- `supabase/migrations/README.md` - Migration instructions

## Decisions Made
- Used `CookieOptions` type import from @supabase/ssr for strict TypeScript compliance
- Admin check is dynamic (env var) rather than database flag for deployment flexibility
- Storage portraits bucket is public to allow n8n workflow to read portrait URLs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript implicit any errors**
- **Found during:** Task 1 verification
- **Issue:** `cookiesToSet` parameter in setAll callbacks had implicit any type
- **Fix:** Added explicit type annotation `{ name: string; value: string; options: CookieOptions }[]`
- **Files modified:** src/lib/supabase/server.ts, src/lib/supabase/middleware.ts
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 9b2e700

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** TypeScript strict mode required explicit types. No scope change.

## Issues Encountered
- Parallel agent (01-01) committed migration files during this execution. Task 2 commit was a no-op since files were already committed. Plan completed successfully.

## User Setup Required

**External services require manual configuration.** Users must:

1. **Supabase Project Setup:**
   - Create a Supabase project at https://supabase.com
   - Copy Project URL to `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
   - Copy anon public key to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`

2. **Run Database Migrations:**
   - Go to Supabase Dashboard -> SQL Editor
   - Run `001_profiles.sql` to create profiles table
   - Create 'portraits' bucket in Storage (public: yes)
   - Run `002_storage.sql` to create storage policies

3. **Set Admin Email:**
   - Set `ADMIN_EMAIL` in `.env.local` to your admin email address

## Next Phase Readiness
- Supabase client utilities ready for auth implementation
- Profiles table ready for user data
- Storage bucket ready for portrait uploads
- Next plan (01-03) can implement auth flow using these utilities

---
*Phase: 01-foundation-auth*
*Completed: 2026-02-03*
