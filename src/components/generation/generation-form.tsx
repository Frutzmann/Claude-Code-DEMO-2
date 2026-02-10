"use client"

import { useState, useTransition } from "react"
import { Loader2, Sparkles, AlertCircle, Shield } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PortraitSelector } from "./portrait-selector"
import { BackgroundUpload } from "./background-upload"
import { createBackgroundUploadUrls, createGeneration } from "@/actions/generations"

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

interface GenerationFormProps {
  portraits: Portrait[]
  isAdmin: boolean
  quota: Quota | null
  onGenerationStarted: (generationId: string) => void
}

export function GenerationForm({
  portraits,
  isAdmin,
  quota,
  onGenerationStarted,
}: GenerationFormProps) {
  const [isPending, startTransition] = useTransition()
  const [backgroundFiles, setBackgroundFiles] = useState<File[]>([])
  const [keywords, setKeywords] = useState("")
  const [portraitId, setPortraitId] = useState(() => {
    const active = portraits.find((p) => p.is_active)
    return active?.id || portraits[0]?.id || ""
  })

  const quotaExceeded = !isAdmin && quota && quota.used >= quota.limit
  const hasNoPortraits = portraits.length === 0
  const canSubmit =
    !isPending &&
    !quotaExceeded &&
    !hasNoPortraits &&
    keywords.trim().length >= 3 &&
    portraitId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canSubmit) return

    startTransition(async () => {
      try {
        let uploadedPaths: string[] = []

        if (backgroundFiles.length > 0) {
          // Step 1: Get signed upload URLs
          const urlsResult = await createBackgroundUploadUrls(backgroundFiles.length)

          if (urlsResult.error || !urlsResult.urls) {
            toast.error(urlsResult.error || "Failed to prepare upload")
            return
          }

          // Step 2: Upload files to signed URLs
          const uploadPromises = backgroundFiles.map(async (file, index) => {
            const { signedUrl, path } = urlsResult.urls![index]

            const response = await fetch(signedUrl, {
              method: "PUT",
              headers: {
                "Content-Type": file.type,
              },
              body: file,
            })

            if (!response.ok) {
              throw new Error(`Failed to upload ${file.name}`)
            }

            return path
          })

          uploadedPaths = await Promise.all(uploadPromises)
        }

        // Step 3: Create generation
        const result = await createGeneration({
          portraitId,
          keywords: keywords.trim(),
          backgroundPaths: uploadedPaths,
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success("Generation started!")
        onGenerationStarted(result.generationId!)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5" />
          Generate Thumbnails
        </CardTitle>
        <CardDescription>
          Select a portrait, upload background images, and enter keywords to generate
          AI-powered YouTube thumbnails.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quota display */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            {isAdmin ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="size-4" />
                Admin - Unlimited generations
              </div>
            ) : quota ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {quota.used} / {quota.limit} generations this month
                </span>
                {quotaExceeded && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="size-4" />
                    Quota exceeded
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Portrait selector */}
          <div className="space-y-2">
            <Label htmlFor="portrait">Portrait</Label>
            {hasNoPortraits ? (
              <p className="text-sm text-muted-foreground">
                No portraits found. Upload a portrait in the{" "}
                <a href="/portraits" className="text-primary hover:underline">
                  Portraits
                </a>{" "}
                section first.
              </p>
            ) : (
              <PortraitSelector
                portraits={portraits}
                value={portraitId}
                onChange={setPortraitId}
                disabled={isPending}
              />
            )}
          </div>

          {/* Background upload */}
          <div className="space-y-2">
            <Label>Background Images <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <BackgroundUpload
              files={backgroundFiles}
              onFilesChange={setBackgroundFiles}
              disabled={isPending}
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="automation; n8n; tutorial; productivity..."
              disabled={isPending}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Separate keywords with semicolons. These describe your video topic.
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Starting generation...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Thumbnails
              </>
            )}
          </Button>

          {quotaExceeded && (
            <p className="text-sm text-destructive text-center">
              You have reached your monthly limit. Upgrade to continue generating thumbnails.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
