---
phase: 03
plan: 03
subsystem: generation-ui
tags: [realtime, forms, react-hook-form, supabase-realtime]

requires:
  - 03-01 # Database schema for generations/thumbnails
  - 03-02 # Server actions for createGeneration

provides:
  - Supabase Realtime subscription hook
  - Generation form with portrait/background/keywords
  - Real-time status display with progress
  - Generate page at /generate

affects:
  - 03-04 # Gallery will link to completed generations

tech-stack:
  patterns:
    - Supabase Realtime postgres_changes subscription
    - useRef to prevent stale closures in useEffect
    - Controlled file upload with preview URLs
    - Server component data fetching for form defaults

key-files:
  created:
    - src/hooks/use-generation-status.ts
    - src/components/generation/portrait-selector.tsx
    - src/components/generation/background-upload.tsx
    - src/components/generation/generation-form.tsx
    - src/components/generation/generation-status.tsx
    - src/app/(dashboard)/generate/page.tsx
    - src/app/(dashboard)/generate/client.tsx
  modified:
    - src/components/dashboard/sidebar.tsx

decisions:
  - key: realtime-refs-pattern
    choice: "Use useRef for callbacks to prevent stale closures"
    why: "Prevents dependency array issues in Realtime subscription useEffect"
  - key: form-state-management
    choice: "useState for form inputs instead of react-hook-form"
    why: "Simpler for this use case with file upload state"
  - key: placeholder-gallery-components
    choice: "Created placeholder components for gallery (download-button, client)"
    why: "Unblock TypeScript compilation pending 03-04"

metrics:
  duration: 5 min
  completed: 2026-02-03
---

# Phase 03 Plan 03: Generation Form UI Summary

Generation form with real-time status updates using Supabase Realtime subscriptions.

## What Was Built

### Realtime Hook (src/hooks/use-generation-status.ts)
- `useGenerationStatus({ generationId, onComplete, onError })`
- Fetches initial generation state
- Subscribes to `postgres_changes` on generations table filtered by ID
- Calls callbacks on status changes (completed/failed/partial)
- Cleanup on unmount via `supabase.removeChannel()`

### Portrait Selector (src/components/generation/portrait-selector.tsx)
- shadcn Select component
- Shows portrait thumbnail preview in options
- Displays "(Active)" badge for active portrait
- Returns selected portrait ID via onChange

### Background Upload (src/components/generation/background-upload.tsx)
- Multi-file upload supporting up to 7 images
- Drag-and-drop support with visual feedback
- File type validation (JPEG, PNG, WebP)
- File size validation (5MB max)
- Grid preview of selected files with remove buttons
- Memory-safe preview URL handling (creates/revokes object URLs)

### Generation Form (src/components/generation/generation-form.tsx)
- Portrait selector defaulting to active portrait
- Background upload component
- Keywords input with character limits
- Quota display:
  - Admin: "Admin - Unlimited generations"
  - Regular: "X / Y generations this month"
  - Exceeded: Red alert with blocked submit
- Form submission flow:
  1. Get signed upload URLs via `createBackgroundUploadUrls`
  2. Upload files directly to Supabase Storage
  3. Call `createGeneration` with paths
  4. Trigger `onGenerationStarted` callback

### Generation Status (src/components/generation/generation-status.tsx)
- Uses `useGenerationStatus` hook for Realtime updates
- Status-specific icons and colors:
  - pending: Clock, muted
  - processing: Loader2 (animated), primary
  - completed: CheckCircle, green
  - failed: XCircle, red
  - partial: AlertTriangle, yellow
- Progress bar during processing
- Error message display for failed generations
- Auto-redirect to `/gallery/[id]` on completion
- "Try Again" button for failed state

### Generate Page (src/app/(dashboard)/generate/)
- Server component fetches user portraits and quota
- Client component manages form/status state
- "New Generation" button to start over
- Help text explaining the workflow

### Sidebar Update (src/components/dashboard/sidebar.tsx)
- Enabled Generate link (disabled: false)
- Gallery also enabled (concurrent work from 03-04)

## Task Execution

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | Realtime hook and sub-components | ebe0161 | use-generation-status.ts, portrait-selector.tsx, background-upload.tsx |
| 2 | Generation form and status | 4bd29da | generation-form.tsx, generation-status.tsx |
| 3 | Generate page and sidebar | b3ddd6d | generate/page.tsx, generate/client.tsx, sidebar.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created placeholder gallery components**
- **Found during:** Task 2
- **Issue:** TypeScript errors from existing gallery/[id]/page.tsx referencing missing client.tsx and download-button.tsx
- **Fix:** Created placeholder components to unblock compilation (full implementation in 03-04)
- **Files modified:** gallery/[id]/client.tsx, download-button.tsx
- **Commit:** 4bd29da

**2. [Rule 1 - Bug] Fixed ESLint unused import errors**
- **Found during:** Task 3 build verification
- **Issue:** Unused imports in background-upload.tsx (Button) and use-generation-status.ts (useCallback)
- **Fix:** Removed unused imports
- **Files modified:** background-upload.tsx, use-generation-status.ts
- **Commit:** b3ddd6d

## Component Usage

```tsx
// Use the Realtime hook
const { generation, isLoading } = useGenerationStatus({
  generationId: "uuid",
  onComplete: (gen) => console.log(`Generated ${gen.thumbnail_count} thumbnails`),
  onError: (error) => console.error(error),
})

// Form with all data
<GenerationForm
  portraits={portraits}
  isAdmin={false}
  quota={{ used: 2, limit: 5 }}
  onGenerationStarted={(id) => setGenerationId(id)}
/>

// Status display
<GenerationStatus
  generationId="uuid"
  onNewGeneration={() => reset()}
/>
```

## Next Phase Readiness

Ready for 03-04 (Gallery UI):
- Generation completes and redirects to `/gallery/[id]`
- Gallery page server component exists (created in 03-01)
- Placeholder client component ready for full implementation
- Download button ready for JSZip batch download enhancement

## Known Build Issue

The production build has a pre-existing error unrelated to this plan:
```
Error: <Html> should not be imported outside of pages/_document
```
This is a Next.js configuration issue with 404 page rendering that needs separate investigation. TypeScript compilation succeeds.
