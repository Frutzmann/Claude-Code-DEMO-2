"use client"

import Link from "next/link"
import { GalleryList } from "@/components/generation/gallery-list"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface Generation {
  id: string
  keywords: string
  background_count: number
  thumbnail_count: number
  status: string
  created_at: string
}

interface GalleryClientProps {
  generations: Generation[]
}

export function GalleryClient({ generations }: GalleryClientProps) {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Generations</h1>
          <p className="text-muted-foreground mt-1">
            View and download your generated thumbnails.
          </p>
        </div>
        <Button asChild>
          <Link href="/generate">
            <Sparkles className="size-4 mr-2" />
            New Generation
          </Link>
        </Button>
      </div>

      {/* Generations list */}
      <GalleryList generations={generations} />
    </div>
  )
}
