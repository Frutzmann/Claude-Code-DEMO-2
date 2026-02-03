"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

// Placeholder - Full implementation with batch download in Plan 03-04

interface DownloadButtonProps {
  publicUrl: string
  filename: string
}

export function DownloadButton({ publicUrl, filename }: DownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(publicUrl)
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
      console.error("Download failed:", error)
    }
  }

  return (
    <Button size="sm" onClick={handleDownload}>
      <Download className="size-4" />
    </Button>
  )
}
