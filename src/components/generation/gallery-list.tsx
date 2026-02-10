"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
} from "lucide-react"

interface Generation {
  id: string
  keywords: string
  background_count: number
  thumbnail_count: number
  status: string
  created_at: string
}

interface GalleryListProps {
  generations: Generation[]
}

export function GalleryList({ generations }: GalleryListProps) {
  if (generations.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No generations yet.</p>
        <Button asChild>
          <Link href="/generate">Create your first thumbnails</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {generations.map((gen) => (
        <Link key={gen.id} href={`/gallery/${gen.id}`}>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              {/* Thumbnail preview placeholder */}
              <div className="size-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <ImageIcon className="size-8 text-muted-foreground" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {gen.keywords.length > 50
                    ? `${gen.keywords.slice(0, 50)}...`
                    : gen.keywords}
                </p>
                <p className="text-sm text-muted-foreground">
                  {gen.thumbnail_count} thumbnail{gen.thumbnail_count !== 1 ? "s" : ""}
                  {gen.background_count > 0
                    ? ` from ${gen.background_count} background${gen.background_count !== 1 ? "s" : ""}`
                    : " from keywords only"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(gen.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              {/* Status badge */}
              <Badge
                variant={
                  gen.status === "completed"
                    ? "default"
                    : gen.status === "failed"
                      ? "destructive"
                      : "secondary"
                }
                className="flex-shrink-0"
              >
                {gen.status === "completed" && (
                  <CheckCircle className="size-3 mr-1" />
                )}
                {gen.status === "failed" && <XCircle className="size-3 mr-1" />}
                {gen.status === "processing" && (
                  <Loader2 className="size-3 mr-1 animate-spin" />
                )}
                {gen.status === "pending" && <Clock className="size-3 mr-1" />}
                {gen.status}
              </Badge>

              <ChevronRight className="size-5 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
