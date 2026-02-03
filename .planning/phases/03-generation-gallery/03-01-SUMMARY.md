---
phase: 03-generation-gallery
plan: 01
subsystem: data-layer
tags: [supabase, database, shadcn, dependencies, realtime]
dependency_graph:
  requires: [01-foundation, 02-portraits]
  provides: [generations-schema, thumbnails-schema, phase3-dependencies]
  affects: [03-02, 03-03, 03-04]
tech_stack:
  added:
    - jszip@3.10.1
    - file-saver@2.0.5
    - "@types/file-saver@2.0.7"
  patterns: [realtime-subscriptions, service-role-callback]
key_files:
  created:
    - supabase/migrations/004_generations.sql
    - src/types/database.ts
    - src/components/ui/progress.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/tooltip.tsx
    - src/components/ui/select.tsx
  modified:
    - package.json
    - package-lock.json
decisions:
  - id: 03-01-01
    description: "Generations table uses TEXT status with CHECK constraint for type safety"
    rationale: "PostgreSQL enum would require migration for new values; CHECK allows flexibility"
  - id: 03-01-02
    description: "Service role policies allow any update to generations/insert to thumbnails"
    rationale: "n8n callback needs service role access; RLS read policies protect user data"
  - id: 03-01-03
    description: "REPLICA IDENTITY FULL enabled on generations for Realtime"
    rationale: "Required for Supabase Realtime subscriptions to receive UPDATE payloads"
metrics:
  duration: 2min
  completed: 2026-02-03
---

# Phase 3 Plan 1: Foundation Setup Summary

Database schema for generations/thumbnails with Phase 3 dependencies installed and TypeScript types defined.

## What Was Built

### Task 1: Dependencies and UI Components

Installed npm packages for batch download functionality:
- `jszip@3.10.1` - Client-side ZIP file creation
- `file-saver@2.0.5` - Browser file download trigger
- `@types/file-saver@2.0.7` - TypeScript definitions

Installed shadcn/ui components:
- `progress` - Generation progress bar (0-100%)
- `tabs` - Gallery view organization
- `tooltip` - Action button hints
- `select` - Portrait selection in generation form

Note: `dropdown-menu` was already present in the project.

### Task 2: Database Migration (004_generations.sql)

Created two tables following the established pattern from `003_portraits.sql`:

**generations table:**
- Tracks overall generation jobs
- Status: pending/processing/completed/failed/partial
- Progress tracking (0-100) with current_step description
- Links to portrait (FK with SET NULL on delete)
- Snapshot of portrait_url at generation time
- Quota tracking via credits_used field

**thumbnails table:**
- Individual generated images per generation
- Storage path and public URL references
- Prompt metadata (text, index, background_index)
- Kie.ai task_id for debugging
- Status: success/failed with error_message

**Security (RLS):**
- Users can SELECT/INSERT own generations
- Users can SELECT thumbnails through their generations
- Service role can UPDATE generations (for n8n callback)
- Service role can INSERT thumbnails (for n8n callback)

**Performance:**
- Index on generations(user_id)
- Index on generations(status)
- Index on thumbnails(generation_id)

**Realtime:**
- REPLICA IDENTITY FULL enabled for Realtime subscriptions
- updated_at trigger for tracking changes

### Task 3: TypeScript Types (database.ts)

Created comprehensive type definitions:
- Database interface with all tables
- Row, Insert, Update types for each table
- Convenience aliases: Generation, Thumbnail, Profile, Portrait
- Status union types: GenerationStatus, ThumbnailStatus

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### Migration Execution
The migration file is ready but must be run manually in Supabase Dashboard SQL Editor. After running:
1. Navigate to Database > Publications > supabase_realtime
2. Toggle ON for the `generations` table

### Type Safety
The Database types enable full type safety with Supabase client:
```typescript
import type { Database, Generation, Thumbnail } from '@/types/database'
const supabase = createClient<Database>()
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 01b38dd | chore | Install Phase 3 dependencies and UI components |
| 9f25f23 | feat | Add generations and thumbnails database schema |
| 1644083 | feat | Add TypeScript types for database tables |

## Verification Results

- [x] jszip and file-saver packages installed
- [x] @types/file-saver dev dependency installed
- [x] progress, tabs, tooltip, select shadcn components installed
- [x] dropdown-menu already present (pre-existing)
- [x] 004_generations.sql migration file created
- [x] RLS policies defined for user access + service role updates
- [x] Realtime enabled on generations table (REPLICA IDENTITY FULL)
- [x] database.ts types updated with Generation and Thumbnail interfaces
- [x] TypeScript compiles without errors

## Next Phase Readiness

**Immediate blockers:** None

**Required before Phase 3 Plan 2:**
- Run 004_generations.sql in Supabase SQL Editor
- Enable Realtime publication for generations table in Supabase Dashboard

**Dependencies satisfied for:**
- 03-02: Generation form can use types, select component
- 03-03: Callback route can use types for database operations
- 03-04: Gallery can use tabs, progress, types for display
