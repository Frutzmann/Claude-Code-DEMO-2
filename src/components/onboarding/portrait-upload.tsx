"use client"

import { createClient } from "@/lib/supabase/client"
import { updateAvatarUrl } from "@/actions/onboarding"
import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { Upload, ImageIcon, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface PortraitUploadProps {
  userId: string
  onComplete: () => void
}

export function PortraitUpload({ userId, onComplete }: PortraitUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return false
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return false
    }

    return true
  }

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setSelectedFile(file)
  }, [])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setUploading(true)

    try {
      const fileExt = selectedFile.name.split(".").pop()?.toLowerCase() || "jpg"
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("portraits")
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("portraits").getPublicUrl(fileName)

      const result = await updateAvatarUrl(publicUrl)

      if (result.error) throw new Error(result.error)

      toast.success("Portrait uploaded successfully!")
      onComplete()
    } catch (error) {
      toast.error("Failed to upload portrait")
      console.error(error)
    } finally {
      setUploading(false)
    }
  }, [selectedFile, userId, supabase, onComplete])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0])
      }
    },
    [handleFileSelect]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0])
      }
    },
    [handleFileSelect]
  )

  const clearPreview = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setSelectedFile(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [preview])

  return (
    <div className="space-y-6">
      {!preview ? (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-12
            transition-all duration-200 cursor-pointer
            ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-4 rounded-full bg-muted">
              {dragActive ? (
                <ImageIcon className="size-8 text-primary" />
              ) : (
                <Upload className="size-8 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-lg font-medium">
                {dragActive ? "Drop your image here" : "Drag and drop your portrait"}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden border">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={clearPreview}
              disabled={uploading}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={clearPreview}
              disabled={uploading}
            >
              Choose Another
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  Upload Portrait
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
