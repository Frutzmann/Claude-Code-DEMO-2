"use client"

import { PortraitGrid } from "@/components/portraits/portrait-grid"

interface Portrait {
  id: string
  public_url: string
  label: string
  is_active: boolean
  created_at: string
}

interface PortraitsClientProps {
  portraits: Portrait[]
  userId: string
}

export function PortraitsClient({ portraits, userId }: PortraitsClientProps) {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Portraits</h1>
        <p className="text-muted-foreground mt-1">
          Manage your portrait collection. The active portrait will be used for thumbnail generation.
        </p>
      </div>

      {/* Portrait grid */}
      <PortraitGrid portraits={portraits} userId={userId} />
    </div>
  )
}
