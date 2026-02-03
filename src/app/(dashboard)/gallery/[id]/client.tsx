"use client"

import Link from "next/link"
import Image from "next/image"
import { formatDistanceToNow, format } from "date-fns"
import { ThumbnailGrid } from "@/components/generation/thumbnail-grid"
import { DownloadAllButton } from "@/components/generation/download-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
} from "lucide-react"

interface Generation {
  id: string
  user_id: string
  portrait_id: string | null
  portrait_url: string
  keywords: string
  background_count: number
  status: string
  progress: number | null
  current_step: string | null
  thumbnail_count: number
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  credits_used: number
}

interface Thumbnail {
  id: string
  generation_id: string
  storage_path: string
  public_url: string
  prompt: string | null
  prompt_index: number | null
  background_index: number | null
  kie_task_id: string | null
  status: string | null
  error_message: string | null
  created_at: string
}

interface GenerationDetailClientProps {
  generation: Generation
  thumbnails: Thumbnail[]
}

export function GenerationDetailClient({
  generation,
  thumbnails,
}: GenerationDetailClientProps) {
  const successfulThumbnails = thumbnails.filter((t) => t.status !== "failed")

  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Pending",
      color: "secondary",
    },
    processing: {
      icon: Loader2,
      label: "Processing",
      color: "secondary",
    },
    completed: {
      icon: CheckCircle,
      label: "Completed",
      color: "default",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      color: "destructive",
    },
    partial: {
      icon: CheckCircle,
      label: "Partial Success",
      color: "secondary",
    },
  }

  const config =
    statusConfig[generation.status as keyof typeof statusConfig] ||
    statusConfig.pending
  const StatusIcon = config.icon

  return (
    <div className="space-y-8">
      {/* Back link and header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/gallery">
            <ArrowLeft className="size-4 mr-2" />
            Back to Gallery
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Generation Details</h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(generation.created_at), "PPP 'at' p")}
            </p>
          </div>
          {successfulThumbnails.length > 0 && (
            <DownloadAllButton
              thumbnails={successfulThumbnails}
              generationId={generation.id}
            />
          )}
        </div>
      </div>

      {/* Generation metadata */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Portrait used */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Portrait Used
              </p>
              {generation.portrait_url ? (
                <div className="size-16 rounded-lg overflow-hidden relative bg-muted">
                  <Image
                    src={generation.portrait_url}
                    alt="Portrait used"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="size-16 rounded-lg bg-muted flex items-center justify-center">
                  <User className="size-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Keywords
              </p>
              <p className="text-sm">{generation.keywords}</p>
            </div>

            {/* Counts */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Results
              </p>
              <p className="text-sm">
                {generation.thumbnail_count} thumbnail
                {generation.thumbnail_count !== 1 ? "s" : ""} from{" "}
                {generation.background_count} background
                {generation.background_count !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <Badge
                variant={
                  config.color as "default" | "secondary" | "destructive"
                }
              >
                <StatusIcon
                  className={`size-3 mr-1 ${generation.status === "processing" ? "animate-spin" : ""}`}
                />
                {config.label}
              </Badge>
              {generation.error_message && (
                <p className="text-xs text-destructive mt-1">
                  {generation.error_message}
                </p>
              )}
            </div>
          </div>

          {/* Time details */}
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex flex-wrap gap-4">
            <span>
              Created:{" "}
              {formatDistanceToNow(new Date(generation.created_at), {
                addSuffix: true,
              })}
            </span>
            {generation.started_at && (
              <span>
                Started:{" "}
                {formatDistanceToNow(new Date(generation.started_at), {
                  addSuffix: true,
                })}
              </span>
            )}
            {generation.completed_at && (
              <span>
                Completed:{" "}
                {formatDistanceToNow(new Date(generation.completed_at), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thumbnails grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Generated Thumbnails</h2>
        <ThumbnailGrid thumbnails={thumbnails} />
      </div>
    </div>
  )
}
