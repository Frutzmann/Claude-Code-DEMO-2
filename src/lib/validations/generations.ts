import { z } from "zod"

/**
 * Schema for creating a new thumbnail generation request
 */
export const createGenerationSchema = z.object({
  portraitId: z.string().uuid("Invalid portrait ID"),
  keywords: z
    .string()
    .min(3, "Keywords must be at least 3 characters")
    .max(500, "Keywords too long"),
  backgroundPaths: z
    .array(z.string().min(1, "Invalid background path"))
    .max(7, "Maximum 7 background images allowed"),
})

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>

// For validating file uploads (checked separately from zod)
export const MAX_BACKGROUNDS = 7
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
