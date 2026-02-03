---
phase: 01-foundation-auth
plan: 04
subsystem: onboarding
tags: [onboarding, portrait-upload, dashboard, middleware, supabase-storage]

# Dependency graph
requires: [01-03]
provides:
  - Portrait upload with drag-drop and file validation
  - Welcome tutorial explaining the workflow
  - Dashboard shell with sidebar navigation
  - Onboarding enforcement via middleware
  - User navigation with sign-out
affects: [02-portrait-management, 03-generation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Drag-drop file upload with preview"
    - "Supabase Storage upload to user folder"
    - "Middleware profile query for onboarding status"
    - "Dashboard layout with fixed sidebar"

key-files:
  created:
    - src/actions/onboarding.ts
    - src/app/(onboarding)/layout.tsx
    - src/app/(onboarding)/onboarding/page.tsx
    - src/app/(onboarding)/welcome/page.tsx
    - src/components/onboarding/portrait-upload.tsx
    - src/components/onboarding/welcome-tutorial.tsx
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - src/components/dashboard/sidebar.tsx
    - src/components/dashboard/user-nav.tsx
  modified:
    - src/middleware.ts

key-decisions:
  - "Onboarding is 2-step: portrait upload then welcome tutorial"
  - "Dashboard sidebar items disabled with 'Soon' badge until implemented"
  - "Portrait stored in portraits/{userId}/{uuid}.{ext} path"

patterns-established:
  - "Onboarding layout with step progress indicator"
  - "Dashboard layout: fixed sidebar + header + main content"
  - "Middleware checks profile.onboarding_completed for routing"

# Metrics
duration: 4min
completed: 2026-02-03
checkpoint: human-verify (approved)
---

# Phase 1 Plan 4: Onboarding Flow Summary

**Onboarding flow with portrait upload, welcome tutorial, dashboard shell, and middleware enforcement**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T10:36:00Z
- **Completed:** 2026-02-03T10:40:00Z
- **Tasks:** 3
- **Files created:** 10
- **Files modified:** 1
- **Checkpoint:** Human verification approved

## Accomplishments
- Portrait upload component with drag-drop, click-to-select, preview, and 5MB limit
- Welcome tutorial with 3-step workflow explanation
- Onboarding layout with step progress indicator
- Dashboard shell with sidebar navigation (disabled items marked "Soon")
- User navigation dropdown with avatar, name, and sign-out
- Middleware updated to enforce onboarding and redirect completed users

## Task Commits

Each task was committed atomically:

1. **Task 1: Create onboarding flow pages and components** - `74b0d68` (feat)
2. **Task 2: Create dashboard shell with sidebar and empty state** - `8495744` (feat)
3. **Task 3: Update middleware for onboarding enforcement** - `896b449` (feat)

## Files Created/Modified
- `src/actions/onboarding.ts` - completeOnboarding server action
- `src/app/(onboarding)/layout.tsx` - Centered layout with step indicator
- `src/app/(onboarding)/onboarding/page.tsx` - Portrait upload page
- `src/app/(onboarding)/welcome/page.tsx` - Welcome tutorial page
- `src/components/onboarding/portrait-upload.tsx` - Drag-drop upload with preview
- `src/components/onboarding/welcome-tutorial.tsx` - 3-step workflow explanation
- `src/app/(dashboard)/layout.tsx` - Two-column layout with sidebar
- `src/app/(dashboard)/dashboard/page.tsx` - Empty state with stats cards
- `src/components/dashboard/sidebar.tsx` - Navigation with active states
- `src/components/dashboard/user-nav.tsx` - User dropdown with sign-out
- `src/middleware.ts` - Added onboarding status check

## Decisions Made
- **2-step onboarding:** Portrait upload first, then welcome tutorial with complete button
- **Disabled sidebar items:** Generate, Gallery, Portraits, Settings show "Soon" badge
- **Portrait path:** `portraits/{userId}/{uuid}.{ext}` for unique filenames

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- None

## User Setup Required

**Must have Supabase configured before testing:**
1. `.env.local` with valid Supabase credentials
2. `profiles` table with `onboarding_completed` column
3. `portraits` storage bucket (public)
4. RLS policies from migrations

## Checkpoint Verification

Human verification completed successfully:
- Full auth flow: signup → email verify → onboarding → dashboard
- Portrait upload with drag-drop working
- Welcome tutorial completion redirects to dashboard
- Sign-out and re-login skips onboarding
- Dark theme consistent throughout

## Next Phase Readiness
- Foundation complete with auth and onboarding
- Dashboard shell ready for additional pages
- Sidebar ready to enable links as features are built
- Ready for Phase 2: Portrait management

---
*Phase: 01-foundation-auth*
*Completed: 2026-02-03*
*Human verified: approved*
