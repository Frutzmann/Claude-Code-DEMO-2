"use client"

// Placeholder - Full implementation in Plan 03-04

interface Generation {
  id: string
  keywords: string
  background_count: number
  thumbnail_count: number | null
  status: string
  created_at: string
}

interface Thumbnail {
  id: string
  public_url: string
  prompt: string | null
  prompt_index: number | null
  background_index: number | null
  status: string | null
  error_message: string | null
}

interface GenerationDetailClientProps {
  generation: Generation
  thumbnails: Thumbnail[]
}

export function GenerationDetailClient({
  generation,
  thumbnails,
}: GenerationDetailClientProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Generation Details</h1>
        <p className="text-muted-foreground mt-1">
          {generation.keywords}
        </p>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Gallery view coming in Plan 03-04. {thumbnails.length} thumbnails generated.
        </p>
      </div>
    </div>
  )
}
