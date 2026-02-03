# Phase 2: Portraits - Research

**Researched:** 2026-02-03
**Domain:** Supabase Storage + Database Portrait Library + Image Grid UI
**Confidence:** HIGH

## Summary

This research covers building a portrait management library for users to upload, view, select, and delete portrait images for thumbnail generation. The phase implements requirements PORT-01 through PORT-05.

The standard approach uses a new `portraits` database table to track multiple portraits per user (replacing single `avatar_url` in profiles), Supabase Storage's existing `portraits` bucket with user-folder structure for file organization, and a responsive grid layout using shadcn/ui Card components with aspect-ratio containers. The "active" portrait concept replaces the single `avatar_url` paradigm with an `is_active` boolean flag in the portraits table. Delete protection uses application-level validation (checking count before delete) rather than database triggers for simplicity and better error messaging.

Key insight: The existing onboarding flow already uploads a portrait to Storage using the `{user_id}/{uuid}.{ext}` path pattern. Phase 2 extends this by creating a database table to track portraits with metadata (label, is_active), enabling the library view and management features.

**Primary recommendation:** Create a `portraits` table with `is_active` flag, migrate the onboarding to insert into this table, use optimistic UI with `useOptimistic` for delete operations, and implement delete protection in the server action with count check.

## Standard Stack

The established libraries/tools for this phase:

### Core (Already in Project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.49.1 | Storage file operations | Already in use, list/upload/delete files |
| `@supabase/ssr` | ^0.6.1 | Server-side Supabase client | Already in use, cookie-based sessions |
| `next/image` | 15.3.1 | Optimized image display | Built-in, handles lazy loading and sizing |
| `lucide-react` | ^0.474.0 | Icons (Trash2, Star, Upload, Plus) | Already in use |
| `sonner` | ^2.0.7 | Toast notifications | Already in use for feedback |

### New Components Needed (via shadcn/ui)

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `AlertDialog` | Delete confirmation | Before destructive portrait deletion |
| `Dialog` | Upload modal / Preview | Portrait upload form in modal |
| `Badge` | "Active" indicator | Show which portrait is currently active |
| `Skeleton` | Loading states | While portraits grid loads |

### Already Available (shadcn/ui installed)

| Component | Purpose |
|-----------|---------|
| `Card`, `CardContent`, `CardHeader` | Portrait grid items |
| `Button` | Actions (upload, delete, set active) |
| `Input` | Label editing |
| `Label` | Form labels |

### Installation

```bash
# Add missing shadcn/ui components
npx shadcn@latest add alert-dialog dialog badge skeleton
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── portraits/
│           ├── page.tsx           # Server component: fetch portraits, render grid
│           └── client.tsx         # Client component: grid with interactions
├── components/
│   └── portraits/
│       ├── portrait-grid.tsx      # Grid layout with cards
│       ├── portrait-card.tsx      # Individual portrait card
│       ├── portrait-upload-dialog.tsx  # Upload dialog/modal
│       └── delete-portrait-dialog.tsx  # Confirmation dialog
├── actions/
│   └── portraits.ts               # Server actions: upload, delete, set-active, update-label
└── lib/
    └── validations/
        └── portraits.ts           # Zod schemas for portrait operations
```

### Pattern 1: Portraits Database Table

**What:** Separate table to track portrait metadata with active selection.
**When to use:** Replace single avatar_url to support multiple portraits.

```sql
-- Create portraits table
CREATE TABLE portraits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,          -- e.g., "{user_id}/{uuid}.jpg"
  public_url TEXT NOT NULL,            -- Full public URL from Storage
  label TEXT DEFAULT '',               -- User-provided label for organization
  is_active BOOLEAN DEFAULT FALSE,     -- Only one active per user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE portraits ENABLE ROW LEVEL SECURITY;

-- Users can read own portraits
CREATE POLICY "Users can read own portraits"
ON portraits FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own portraits
CREATE POLICY "Users can insert own portraits"
ON portraits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own portraits
CREATE POLICY "Users can update own portraits"
ON portraits FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own portraits
CREATE POLICY "Users can delete own portraits"
ON portraits FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX portraits_user_id_idx ON portraits(user_id);
CREATE INDEX portraits_is_active_idx ON portraits(user_id, is_active) WHERE is_active = TRUE;

-- Update timestamp trigger (reuse from profiles)
CREATE TRIGGER portraits_updated_at
  BEFORE UPDATE ON portraits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Pattern 2: Active Portrait Selection (Single Active Constraint)

**What:** Ensure only one portrait per user has `is_active = TRUE`.
**When to use:** When setting a portrait as active.

```typescript
// actions/portraits.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function setActivePortrait(portraitId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Transaction-like: First deactivate all, then activate one
  // Note: Supabase JS doesn't have true transactions, so we do this in sequence

  // Deactivate all portraits for this user
  const { error: deactivateError } = await supabase
    .from("portraits")
    .update({ is_active: false })
    .eq("user_id", user.id)

  if (deactivateError) return { error: deactivateError.message }

  // Activate the selected portrait
  const { error: activateError } = await supabase
    .from("portraits")
    .update({ is_active: true })
    .eq("id", portraitId)
    .eq("user_id", user.id)  // Security: ensure user owns it

  if (activateError) return { error: activateError.message }

  revalidatePath("/portraits")
  revalidatePath("/dashboard")

  return { success: true }
}
```

### Pattern 3: Delete Protection (Prevent Last Portrait Deletion)

**What:** Application-level check to prevent deleting the only portrait.
**When to use:** Before any portrait deletion.

```typescript
// actions/portraits.ts
export async function deletePortrait(portraitId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Count user's portraits BEFORE deleting
  const { count, error: countError } = await supabase
    .from("portraits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (countError) return { error: countError.message }

  if (count === null || count <= 1) {
    return { error: "Cannot delete your only portrait. Upload another first." }
  }

  // Get the portrait to check ownership and get storage path
  const { data: portrait, error: fetchError } = await supabase
    .from("portraits")
    .select("storage_path, is_active")
    .eq("id", portraitId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !portrait) {
    return { error: "Portrait not found" }
  }

  // If deleting active portrait, we need to set another as active
  const wasActive = portrait.is_active

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("portraits")
    .remove([portrait.storage_path])

  if (storageError) {
    console.error("Storage delete error:", storageError)
    // Continue anyway - orphaned files are less bad than orphaned DB records
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("portraits")
    .delete()
    .eq("id", portraitId)

  if (deleteError) return { error: deleteError.message }

  // If we deleted the active portrait, set the most recent one as active
  if (wasActive) {
    const { data: newActive } = await supabase
      .from("portraits")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (newActive) {
      await supabase
        .from("portraits")
        .update({ is_active: true })
        .eq("id", newActive.id)
    }
  }

  revalidatePath("/portraits")
  revalidatePath("/dashboard")

  return { success: true }
}
```

### Pattern 4: Portrait Grid with Optimistic Delete

**What:** Use React's `useOptimistic` for instant UI feedback on delete.
**When to use:** Portrait grid component.

```typescript
// components/portraits/portrait-grid.tsx
"use client"

import { useOptimistic, useTransition } from "react"
import { deletePortrait, setActivePortrait } from "@/actions/portraits"
import { toast } from "sonner"

interface Portrait {
  id: string
  public_url: string
  label: string
  is_active: boolean
}

export function PortraitGrid({ portraits: initialPortraits }: { portraits: Portrait[] }) {
  const [isPending, startTransition] = useTransition()

  const [optimisticPortraits, removeOptimistic] = useOptimistic(
    initialPortraits,
    (current, portraitId: string) => current.filter(p => p.id !== portraitId)
  )

  async function handleDelete(portraitId: string) {
    // Optimistically remove from UI
    startTransition(() => {
      removeOptimistic(portraitId)
    })

    const result = await deletePortrait(portraitId)

    if (result.error) {
      toast.error(result.error)
      // revalidatePath in server action will restore the portrait
    } else {
      toast.success("Portrait deleted")
    }
  }

  // ... render grid with optimisticPortraits
}
```

### Pattern 5: Upload Dialog with Progress

**What:** Modal dialog for uploading new portraits with label input.
**When to use:** "Add Portrait" button click.

```typescript
// components/portraits/portrait-upload-dialog.tsx
"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { uploadPortrait } from "@/actions/portraits"
import { Plus, Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export function PortraitUploadDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [label, setLabel] = useState("")
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return

    setUploading(true)

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("portraits")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("portraits")
        .getPublicUrl(fileName)

      // Create database record via server action
      const result = await uploadPortrait({
        storagePath: fileName,
        publicUrl,
        label: label.trim() || undefined,
      })

      if (result.error) throw new Error(result.error)

      toast.success("Portrait uploaded!")
      setOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to upload portrait")
      console.error(error)
    } finally {
      setUploading(false)
    }
  }, [file, userId, label, supabase])

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setLabel("")
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add Portrait
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload New Portrait</DialogTitle>
        </DialogHeader>
        {/* ... form content */}
      </DialogContent>
    </Dialog>
  )
}
```

### Anti-Patterns to Avoid

- **Storing images directly in database:** Use Storage + URL references, not BYTEA/BLOB
- **Using database triggers for minimum count:** Application-level validation gives better error messages
- **Querying all portraits to check count:** Use `SELECT ... { count: "exact", head: true }` for efficient counting
- **Forgetting to delete storage files:** Always delete from storage AND database; storage orphans are acceptable, database orphans are not
- **Race conditions on active toggle:** Sequential update is acceptable for single-user operations; no need for complex transaction handling
- **Client-side delete without confirmation:** Always use AlertDialog for destructive actions

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Manual resize/compress | `next/image` | Automatic WebP, lazy loading, sizing |
| Delete confirmation | Custom modal | `AlertDialog` (shadcn/ui) | Accessible, keyboard handling |
| Loading placeholders | Manual skeleton | `Skeleton` (shadcn/ui) | Consistent animation, sizing |
| File type validation | Manual MIME checking | Input `accept` + server check | Browser handles common cases |
| Grid layout | Custom flex/grid CSS | CSS Grid with `aspect-ratio` | Consistent, responsive |
| Optimistic updates | Manual state management | `useOptimistic` hook | React 19 built-in, handles rollback |

**Key insight:** The existing portrait upload component from onboarding can be refactored and reused. The drag-drop zone, preview, and upload logic are already implemented.

## Common Pitfalls

### Pitfall 1: Orphaned Storage Files

**What goes wrong:** Database record deleted but storage file remains, wasting space.
**Why it happens:** Deleting from database first, then storage fails silently.
**How to avoid:**
1. Delete from storage first, log errors but continue
2. Delete from database second
3. Orphaned storage files are cleanup-able; orphaned DB records break UI
**Warning signs:** Storage usage grows faster than expected, 404s on old URLs.

### Pitfall 2: Race Condition on Active Toggle

**What goes wrong:** User rapidly clicks multiple portraits as "active," leaving multiple active or none.
**Why it happens:** Concurrent requests to set different portraits as active.
**How to avoid:**
1. Disable other cards while one is being set active (UI-level)
2. Use `isPending` from `useTransition` to show loading state
3. The sequential update approach is acceptable for single-user; race conditions between tabs are rare and self-correcting
**Warning signs:** Multiple portraits showing "Active" badge, or none showing it.

### Pitfall 3: Delete Button on Last Portrait

**What goes wrong:** User deletes their only portrait, breaking thumbnail generation.
**Why it happens:** No validation before delete.
**How to avoid:**
1. Server action checks count BEFORE delete
2. UI can also hide/disable delete button when count === 1
3. Error message explains how to delete (upload another first)
**Warning signs:** Users reporting "cannot generate thumbnails" after deleting portraits.

### Pitfall 4: Large Image Uploads Blocking UI

**What goes wrong:** Uploading 5MB image on slow connection freezes the upload button for minutes.
**Why it happens:** No progress feedback, user thinks it's broken.
**How to avoid:**
1. Show uploading state immediately
2. Consider adding progress indicator (though Supabase JS upload doesn't expose progress easily)
3. Validate file size before upload
4. Set reasonable timeout and catch errors
**Warning signs:** Users abandoning uploads, multiple duplicate uploads from retry clicks.

### Pitfall 5: Missing Storage RLS Policies for Delete

**What goes wrong:** 403 error when trying to delete files from storage.
**Why it happens:** Upload policy exists but delete policy is missing.
**How to avoid:**
```sql
-- Add delete policy if not exists
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portraits' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```
**Warning signs:** Delete works in database but storage errors logged.

## Code Examples

### Listing User's Portraits

```typescript
// In server component: app/(dashboard)/portraits/page.tsx
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PortraitGrid } from "./client"

export default async function PortraitsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: portraits, error } = await supabase
    .from("portraits")
    .select("id, public_url, label, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching portraits:", error)
    // Handle error state
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Portraits</h1>
          <p className="text-muted-foreground">
            Manage portrait images for thumbnail generation
          </p>
        </div>
        <PortraitUploadDialog userId={user.id} />
      </div>

      <PortraitGrid portraits={portraits || []} />
    </div>
  )
}
```

### Portrait Card Component

```typescript
// components/portraits/portrait-card.tsx
"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Trash2, Pencil, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PortraitCardProps {
  portrait: {
    id: string
    public_url: string
    label: string
    is_active: boolean
  }
  onSetActive: (id: string) => void
  onDelete: (id: string) => void
  onEditLabel: (id: string, label: string) => void
  isOnlyPortrait: boolean
  isPending: boolean
}

export function PortraitCard({
  portrait,
  onSetActive,
  onDelete,
  onEditLabel,
  isOnlyPortrait,
  isPending,
}: PortraitCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all",
      portrait.is_active && "ring-2 ring-primary"
    )}>
      <CardContent className="p-0">
        {/* Image with aspect ratio */}
        <div className="relative aspect-square">
          <Image
            src={portrait.public_url}
            alt={portrait.label || "Portrait"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />

          {/* Active badge */}
          {portrait.is_active && (
            <Badge className="absolute top-2 left-2">
              <Star className="size-3 mr-1 fill-current" />
              Active
            </Badge>
          )}

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {!portrait.is_active && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onSetActive(portrait.id)}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Star className="size-4" />
                    Set Active
                  </>
                )}
              </Button>
            )}

            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(portrait.id)}
              disabled={isPending || isOnlyPortrait}
              title={isOnlyPortrait ? "Cannot delete only portrait" : "Delete portrait"}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Label */}
        <div className="p-3 border-t">
          <p className="text-sm truncate">
            {portrait.label || "Untitled"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Delete Confirmation Dialog

```typescript
// components/portraits/delete-portrait-dialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeletePortraitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  portraitLabel: string
}

export function DeletePortraitDialog({
  open,
  onOpenChange,
  onConfirm,
  portraitLabel,
}: DeletePortraitDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete portrait?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <strong>{portraitLabel || "this portrait"}</strong>. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Zod Validation Schema

```typescript
// lib/validations/portraits.ts
import { z } from "zod"

export const uploadPortraitSchema = z.object({
  storagePath: z.string().min(1, "Storage path required"),
  publicUrl: z.string().url("Invalid URL"),
  label: z.string().max(100, "Label too long").optional(),
})

export const updateLabelSchema = z.object({
  portraitId: z.string().uuid("Invalid portrait ID"),
  label: z.string().max(100, "Label too long"),
})

export type UploadPortraitInput = z.infer<typeof uploadPortraitSchema>
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single avatar_url in profiles | Separate portraits table | This phase | Enables multiple portraits per user |
| Manual optimistic state | `useOptimistic` hook | React 19 (2025) | Built-in rollback, cleaner code |
| CSS float grids | CSS Grid with `aspect-ratio` | Modern CSS | Consistent image sizing without JS |
| Custom delete confirmation | AlertDialog (Radix UI) | shadcn/ui standard | Accessible, keyboard support |

**Deprecated/outdated:**
- `useState` for optimistic updates: Use `useOptimistic` for automatic rollback
- Manual loading state management: Use `useTransition` with `isPending`

## Open Questions

Things that couldn't be fully resolved:

1. **Migration of existing onboarding portrait**
   - What we know: Onboarding uploads to Storage and sets profiles.avatar_url
   - What's unclear: Should migration auto-create portrait record for existing users?
   - Recommendation: On first visit to /portraits, check if user has portraits in DB; if not but has avatar_url in profile, create initial portrait record from profile.avatar_url

2. **Upload progress indicator**
   - What we know: Supabase JS upload doesn't expose native progress events
   - What's unclear: Is progress feedback important enough to warrant complexity?
   - Recommendation: Show spinner/uploading state; for true progress, would need TUS resumable upload API (overkill for <5MB images)

3. **Maximum portraits per user**
   - What we know: No explicit requirement for limit
   - What's unclear: Should there be a cap to prevent storage abuse?
   - Recommendation: Add reasonable limit (e.g., 20 portraits) in server action; can adjust based on usage patterns

## Sources

### Primary (HIGH confidence)
- [Supabase Storage list() Method](https://supabase.com/docs/reference/javascript/storage-from-list) - File listing API
- [Supabase Storage remove() Method](https://supabase.com/docs/reference/javascript/storage-from-remove) - File deletion API
- [Supabase Storage Helper Functions](https://supabase.com/docs/guides/storage/schema/helper-functions) - RLS policy helpers (foldername, filename, extension)
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - RLS patterns for storage
- [shadcn/ui Card](https://ui.shadcn.com/docs/components/card) - Card component usage
- [shadcn/ui AlertDialog](https://ui.shadcn.com/docs/components/alert-dialog) - Confirmation dialog
- [React useOptimistic](https://react.dev/reference/react/useOptimistic) - Optimistic UI hook
- [React Managing State](https://react.dev/learn/managing-state) - Selection state patterns

### Secondary (MEDIUM confidence)
- [PostgreSQL Triggers for Constraints](https://www.cybertec-postgresql.com/en/triggers-to-enforce-constraints/) - Why triggers for min count are complex
- [Vercel Image Gallery Guide](https://vercel.com/blog/building-a-fast-animated-image-gallery-with-next-js) - Grid layout patterns
- [Optimistic UI in Next.js](https://dev.to/olaleyeblessing/implementing-optimistic-ui-in-reactjsnextjs-4nkk) - Implementation patterns

### Tertiary (LOW confidence)
- GitHub discussions on Supabase storage patterns - marked for validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies + official shadcn/ui components
- Architecture: HIGH - Patterns verified against Supabase and React official docs
- Pitfalls: HIGH - Based on Phase 1 research + official documentation on RLS and storage

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable libraries, established patterns)
