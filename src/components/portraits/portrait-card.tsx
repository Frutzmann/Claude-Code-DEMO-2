"use client"

import Image from "next/image"
import { Star, Trash2, Pencil } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Portrait {
  id: string
  public_url: string
  label: string
  is_active: boolean
  created_at: string
}

interface PortraitCardProps {
  portrait: Portrait
  onSetActive: () => void
  onDelete: () => void
  onEditLabel: () => void
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
    <Card className="group relative overflow-hidden p-0">
      {/* Image container */}
      <div className="relative aspect-square">
        <Image
          src={portrait.public_url}
          alt={portrait.label || "Portrait"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        />

        {/* Active badge */}
        {portrait.is_active && (
          <Badge className="absolute top-2 left-2 z-10">Active</Badge>
        )}

        {/* Hover overlay with actions */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 transition-opacity",
            "group-hover:opacity-100",
            isPending && "opacity-100"
          )}
        >
          {/* Set Active button - hidden if already active */}
          {!portrait.is_active && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onSetActive}
              disabled={isPending}
              title="Set as active"
            >
              <Star className="size-4" />
            </Button>
          )}

          {/* Edit Label button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={onEditLabel}
            disabled={isPending}
            title="Edit label"
          >
            <Pencil className="size-4" />
          </Button>

          {/* Delete button - disabled if only portrait */}
          <Button
            variant="destructive"
            size="icon"
            onClick={onDelete}
            disabled={isPending || isOnlyPortrait}
            title={isOnlyPortrait ? "Cannot delete only portrait" : "Delete portrait"}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Label */}
      <div className="p-3 border-t">
        <p className="text-sm font-medium truncate">
          {portrait.label || "Untitled"}
        </p>
      </div>
    </Card>
  )
}
