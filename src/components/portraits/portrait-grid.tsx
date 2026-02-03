"use client"

import { useState, useTransition, useOptimistic } from "react"
import { toast } from "sonner"
import { PortraitCard } from "./portrait-card"
import { PortraitUploadDialog } from "./portrait-upload-dialog"
import { DeletePortraitDialog } from "./delete-portrait-dialog"
import { EditLabelDialog } from "./edit-label-dialog"
import {
  deletePortrait,
  setActivePortrait,
} from "@/actions/portraits"

interface Portrait {
  id: string
  public_url: string
  label: string
  is_active: boolean
  created_at: string
}

interface PortraitGridProps {
  portraits: Portrait[]
  userId: string
}

export function PortraitGrid({ portraits: initialPortraits, userId }: PortraitGridProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticPortraits, updateOptimisticPortraits] = useOptimistic(
    initialPortraits,
    (state, deletedId: string) => state.filter((p) => p.id !== deletedId)
  )

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Portrait | null>(null)

  // Edit label dialog state
  const [editingPortrait, setEditingPortrait] = useState<{
    id: string
    label: string
  } | null>(null)

  const handleSetActive = (portraitId: string) => {
    startTransition(async () => {
      const result = await setActivePortrait(portraitId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Portrait set as active")
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    startTransition(async () => {
      // Optimistic update
      updateOptimisticPortraits(deleteTarget.id)

      const result = await deletePortrait(deleteTarget.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Portrait deleted")
      setDeleteTarget(null)
    })
  }

  const handleUploadComplete = () => {
    // Server action revalidates path, so we just need to show success
    // Toast is shown in the upload dialog
  }

  const handleEditLabelSave = () => {
    // Server action revalidates path
    setEditingPortrait(null)
  }

  const isOnlyPortrait = optimisticPortraits.length <= 1

  return (
    <div className="space-y-6">
      {/* Header with upload button */}
      <div className="flex justify-end">
        <PortraitUploadDialog userId={userId} onUploadComplete={handleUploadComplete} />
      </div>

      {/* Portrait grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {optimisticPortraits.map((portrait) => (
          <PortraitCard
            key={portrait.id}
            portrait={portrait}
            onSetActive={() => handleSetActive(portrait.id)}
            onDelete={() => setDeleteTarget(portrait)}
            onEditLabel={() =>
              setEditingPortrait({ id: portrait.id, label: portrait.label })
            }
            isOnlyPortrait={isOnlyPortrait}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Empty state */}
      {optimisticPortraits.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No portraits yet. Upload your first portrait to get started.
          </p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <DeletePortraitDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        portraitLabel={deleteTarget?.label || ""}
      />

      {/* Edit label dialog */}
      <EditLabelDialog
        open={!!editingPortrait}
        onOpenChange={(open) => !open && setEditingPortrait(null)}
        portraitId={editingPortrait?.id || ""}
        currentLabel={editingPortrait?.label || ""}
        onSave={handleEditLabelSave}
      />
    </div>
  )
}
