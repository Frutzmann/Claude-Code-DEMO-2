"use client"

import { useState, useCallback, useRef } from "react"
import Image from "next/image"
import { Upload, X, Plus, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import {
  MAX_BACKGROUNDS,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/validations/generations"

interface BackgroundUploadProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
}

export function BackgroundUpload({
  files,
  onFilesChange,
  disabled = false,
}: BackgroundUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previews, setPreviews] = useState<Map<File, string>>(new Map())
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`Invalid file type: ${file.name}. Use JPEG, PNG, or WebP.`)
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large: ${file.name}. Maximum size is 5MB.`)
      return false
    }

    return true
  }, [])

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const validFiles: File[] = []
      const newPreviews = new Map(previews)

      const remainingSlots = MAX_BACKGROUNDS - files.length
      const filesToProcess = Array.from(newFiles).slice(0, remainingSlots)

      for (const file of filesToProcess) {
        if (validateFile(file)) {
          validFiles.push(file)
          // Create preview URL
          const objectUrl = URL.createObjectURL(file)
          newPreviews.set(file, objectUrl)
        }
      }

      if (validFiles.length > 0) {
        setPreviews(newPreviews)
        onFilesChange([...files, ...validFiles])
      }

      if (newFiles.length > remainingSlots) {
        toast.error(`Maximum ${MAX_BACKGROUNDS} images allowed.`)
      }
    },
    [files, previews, onFilesChange, validateFile]
  )

  const removeFile = useCallback(
    (fileToRemove: File) => {
      // Revoke object URL to prevent memory leak
      const previewUrl = previews.get(fileToRemove)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      const newPreviews = new Map(previews)
      newPreviews.delete(fileToRemove)
      setPreviews(newPreviews)

      onFilesChange(files.filter((f) => f !== fileToRemove))
    },
    [files, previews, onFilesChange]
  )

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

      if (disabled) return

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles, disabled]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ""
    },
    [addFiles]
  )

  const canAddMore = files.length < MAX_BACKGROUNDS && !disabled

  return (
    <div className="space-y-4">
      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {files.map((file, index) => {
            const previewUrl = previews.get(file)
            return (
              <div
                key={`${file.name}-${index}`}
                className="relative aspect-video rounded-lg overflow-hidden border bg-muted group"
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={`Background ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center size-full">
                    <ImageIcon className="size-6 text-muted-foreground" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  disabled={disabled}
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <X className="size-3" />
                </button>
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-background/80 text-xs">
                  {index + 1}
                </div>
              </div>
            )
          })}

          {/* Add more button in grid */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1"
            >
              <Plus className="size-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add</span>
            </button>
          )}
        </div>
      )}

      {/* Drop zone (shown when no files or as alternative) */}
      {files.length === 0 && (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8
            transition-all duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
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
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            multiple
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
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
                {dragActive
                  ? "Drop your images here"
                  : "Drag and drop background images"}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Up to {MAX_BACKGROUNDS} images. PNG, JPG, WebP up to 5MB each.
            </p>
          </div>
        </div>
      )}

      {/* Hidden input for adding more files */}
      {files.length > 0 && (
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      )}

      {/* File count indicator */}
      <p className="text-xs text-muted-foreground text-center">
        {files.length} / {MAX_BACKGROUNDS} backgrounds selected
      </p>
    </div>
  )
}
