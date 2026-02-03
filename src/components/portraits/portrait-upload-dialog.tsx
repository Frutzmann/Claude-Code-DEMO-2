"use client"

import { useState, useCallback, useRef } from "react"
import { Plus, Upload, ImageIcon, Loader2, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { uploadPortrait } from "@/actions/portraits"

interface PortraitUploadDialogProps {
  userId: string
  onUploadComplete: () => void
}

export function PortraitUploadDialog({
  userId,
  onUploadComplete,
}: PortraitUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [label, setLabel] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const resetForm = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setSelectedFile(null)
    setLabel("")
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [preview])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    setOpen(newOpen)
  }

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
      const storagePath = `${userId}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("portraits")
        .upload(storagePath, selectedFile)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("portraits").getPublicUrl(storagePath)

      const result = await uploadPortrait({
        storagePath,
        publicUrl,
        label: label || undefined,
      })

      if (result.error) throw new Error(result.error)

      toast.success("Portrait uploaded successfully!")
      onUploadComplete()
      handleOpenChange(false)
    } catch (error) {
      toast.error("Failed to upload portrait")
      console.error(error)
    } finally {
      setUploading(false)
    }
  }, [selectedFile, userId, supabase, label, onUploadComplete])

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add Portrait
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Portrait</DialogTitle>
          <DialogDescription>
            Add a new portrait to your collection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!preview ? (
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-8
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

              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="p-3 rounded-full bg-muted">
                  {dragActive ? (
                    <ImageIcon className="size-6 text-primary" />
                  ) : (
                    <Upload className="size-6 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {dragActive ? "Drop your image here" : "Drag and drop your portrait"}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
              <div className="relative aspect-square max-w-xs mx-auto rounded-xl overflow-hidden border">
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

              <div className="space-y-2">
                <Label htmlFor="portrait-label">Label (optional)</Label>
                <Input
                  id="portrait-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Professional headshot"
                  maxLength={100}
                />
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
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
