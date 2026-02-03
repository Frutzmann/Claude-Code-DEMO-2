"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import JSZip from "jszip"
import { saveAs } from "file-saver"

// Single file download button
interface DownloadButtonProps {
  publicUrl: string
  filename: string
}

export function DownloadButton({ publicUrl, filename }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      const response = await fetch(publicUrl)
      if (!response.ok) throw new Error("Failed to fetch image")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download image")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
    </Button>
  )
}

// Batch download all thumbnails as ZIP
interface Thumbnail {
  id: string
  public_url: string
  prompt_index: number | null
  background_index: number | null
}

interface DownloadAllButtonProps {
  thumbnails: Thumbnail[]
  generationId: string
}

export function DownloadAllButton({
  thumbnails,
  generationId,
}: DownloadAllButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadAll = async () => {
    if (thumbnails.length === 0) return

    setIsDownloading(true)

    try {
      const zip = new JSZip()
      const folder = zip.folder("thumbnails")

      // Download all images in parallel
      const downloads = thumbnails.map(async (thumb) => {
        try {
          const response = await fetch(thumb.public_url)
          if (!response.ok) {
            console.error(`Failed to fetch: ${thumb.public_url}`)
            return
          }

          const blob = await response.blob()
          const filename = `thumbnail_${(thumb.prompt_index ?? 0) + 1}_bg${(thumb.background_index ?? 0) + 1}.png`
          folder?.file(filename, blob)
        } catch (err) {
          console.error(`Error downloading thumbnail ${thumb.id}:`, err)
        }
      })

      await Promise.all(downloads)

      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, `thumbnails-${generationId.slice(0, 8)}.zip`)

      toast.success("Download started")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download thumbnails")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button onClick={handleDownloadAll} disabled={isDownloading}>
      {isDownloading ? (
        <>
          <Loader2 className="size-4 animate-spin mr-2" />
          Creating ZIP...
        </>
      ) : (
        <>
          <Download className="size-4 mr-2" />
          Download All
        </>
      )}
    </Button>
  )
}
