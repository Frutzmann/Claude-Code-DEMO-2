"use client"

import { useState } from "react"
import { Sparkles, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GenerationForm } from "@/components/generation/generation-form"
import { GenerationStatus } from "@/components/generation/generation-status"

interface Portrait {
  id: string
  public_url: string
  label: string
  is_active: boolean
}

interface Quota {
  used: number
  limit: number
}

interface GenerateClientProps {
  portraits: Portrait[]
  isAdmin: boolean
  quota: Quota | null
}

export function GenerateClient({
  portraits,
  isAdmin,
  quota,
}: GenerateClientProps) {
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(
    null
  )

  const handleGenerationStarted = (generationId: string) => {
    setCurrentGenerationId(generationId)
  }

  const handleNewGeneration = () => {
    setCurrentGenerationId(null)
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="size-8 text-primary" />
            Generate Thumbnails
          </h1>
          <p className="text-muted-foreground mt-1">
            Create AI-powered YouTube thumbnails from your portrait and background images.
          </p>
        </div>
        {currentGenerationId && (
          <Button variant="outline" onClick={handleNewGeneration}>
            <Plus className="size-4" />
            New Generation
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="max-w-2xl">
        {currentGenerationId ? (
          <GenerationStatus
            generationId={currentGenerationId}
            onNewGeneration={handleNewGeneration}
          />
        ) : (
          <GenerationForm
            portraits={portraits}
            isAdmin={isAdmin}
            quota={quota}
            onGenerationStarted={handleGenerationStarted}
          />
        )}
      </div>

      {/* Help text */}
      {!currentGenerationId && (
        <div className="max-w-2xl text-sm text-muted-foreground space-y-2">
          <h3 className="font-medium text-foreground">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Select your portrait (or the active one will be used)</li>
            <li>Optionally upload up to 7 background images</li>
            <li>Enter keywords that describe your video topic</li>
            <li>Click Generate and wait 3-7 minutes for AI magic</li>
            <li>Download your thumbnails from the gallery</li>
          </ol>
        </div>
      )}
    </div>
  )
}
