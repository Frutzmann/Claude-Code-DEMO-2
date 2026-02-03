"use client"

import { useState, useEffect, useTransition } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePortraitLabel } from "@/actions/portraits"
import { toast } from "sonner"

interface EditLabelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portraitId: string
  currentLabel: string
  onSave: () => void
}

export function EditLabelDialog({
  open,
  onOpenChange,
  portraitId,
  currentLabel,
  onSave,
}: EditLabelDialogProps) {
  const [label, setLabel] = useState(currentLabel)
  const [isPending, startTransition] = useTransition()

  // Reset label when dialog opens with new portrait
  useEffect(() => {
    if (open) {
      setLabel(currentLabel)
    }
  }, [open, currentLabel])

  const handleSave = () => {
    startTransition(async () => {
      const result = await updatePortraitLabel({
        portraitId,
        label,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Label updated")
      onSave()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Label</DialogTitle>
          <DialogDescription>
            Update the label for this portrait.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter a label..."
              maxLength={100}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
