import { z } from "zod"

export const uploadPortraitSchema = z.object({
  storagePath: z.string().min(1, "Storage path required"),
  publicUrl: z.string().url("Invalid URL"),
  label: z.string().max(100, "Label too long").optional(),
})

export const updateLabelSchema = z.object({
  portraitId: z.string().uuid("Invalid portrait ID"),
  label: z.string().max(100, "Label too long"),
})

export type UploadPortraitInput = z.infer<typeof uploadPortraitSchema>
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>
