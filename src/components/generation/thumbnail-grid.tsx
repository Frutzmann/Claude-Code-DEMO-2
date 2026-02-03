"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { DownloadButton } from "./download-button"
import { XCircle } from "lucide-react"

interface Thumbnail {
  id: string
  public_url: string
  prompt: string | null
  prompt_index: number | null
  background_index: number | null
  status: string | null
  error_message: string | null
}

interface ThumbnailGridProps {
  thumbnails: Thumbnail[]
}

export function ThumbnailGrid({ thumbnails }: ThumbnailGridProps) {
  if (thumbnails.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No thumbnails generated yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {thumbnails.map((thumbnail) => (
        <Card key={thumbnail.id} className="overflow-hidden group">
          <CardContent className="p-0 relative">
            {thumbnail.status === "failed" ? (
              // Failed thumbnail state
              <div className="aspect-video bg-destructive/10 flex flex-col items-center justify-center p-4">
                <XCircle className="size-8 text-destructive mb-2" />
                <p className="text-xs text-destructive text-center">
                  {thumbnail.error_message || "Generation failed"}
                </p>
              </div>
            ) : (
              // Successful thumbnail
              <>
                <div className="aspect-video relative">
                  <Image
                    src={thumbnail.public_url}
                    alt={thumbnail.prompt || "Generated thumbnail"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Hover overlay with download button */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <DownloadButton
                      publicUrl={thumbnail.public_url}
                      filename={`thumbnail_${(thumbnail.prompt_index ?? 0) + 1}_bg${(thumbnail.background_index ?? 0) + 1}.png`}
                    />
                  </div>
                </div>
                {/* Prompt text below */}
                <div className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {thumbnail.prompt || "No prompt available"}
                  </p>
                  {thumbnail.background_index !== null && (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Background {thumbnail.background_index + 1}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
