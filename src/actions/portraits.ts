"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  uploadPortraitSchema,
  updateLabelSchema,
  type UploadPortraitInput,
  type UpdateLabelInput,
} from "@/lib/validations/portraits"
import { z } from "zod"

export async function uploadPortrait(input: UploadPortraitInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const parsed = uploadPortraitSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // Check if this is the user's first portrait
  const { count } = await supabase
    .from("portraits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const isFirstPortrait = count === 0

  const { data, error } = await supabase
    .from("portraits")
    .insert({
      user_id: user.id,
      storage_path: parsed.data.storagePath,
      public_url: parsed.data.publicUrl,
      label: parsed.data.label ?? "",
      is_active: isFirstPortrait,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/portraits")

  return { success: true, portraitId: data.id }
}

export async function deletePortrait(portraitId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Validate portraitId is a valid UUID
  const uuidSchema = z.string().uuid("Invalid portrait ID")
  const parsed = uuidSchema.safeParse(portraitId)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // Count user's portraits before deleting
  const { count } = await supabase
    .from("portraits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  if (count !== null && count <= 1) {
    return { error: "Cannot delete your only portrait. Upload another first." }
  }

  // Fetch portrait to get storage_path and is_active status
  const { data: portrait, error: fetchError } = await supabase
    .from("portraits")
    .select("storage_path, is_active")
    .eq("id", portraitId)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !portrait) {
    return { error: "Portrait not found" }
  }

  // Delete from storage first (log errors but continue)
  const { error: storageError } = await supabase.storage
    .from("portraits")
    .remove([portrait.storage_path])

  if (storageError) {
    console.error("Storage delete error:", storageError.message)
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from("portraits")
    .delete()
    .eq("id", portraitId)
    .eq("user_id", user.id)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // If deleted portrait was active, set most recent remaining portrait as active
  if (portrait.is_active) {
    const { data: mostRecent } = await supabase
      .from("portraits")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (mostRecent) {
      await supabase
        .from("portraits")
        .update({ is_active: true })
        .eq("id", mostRecent.id)
    }
  }

  revalidatePath("/portraits")

  return { success: true }
}

export async function setActivePortrait(portraitId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Validate portraitId is a valid UUID
  const uuidSchema = z.string().uuid("Invalid portrait ID")
  const parsed = uuidSchema.safeParse(portraitId)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  // Deactivate all portraits for this user
  const { error: deactivateError } = await supabase
    .from("portraits")
    .update({ is_active: false })
    .eq("user_id", user.id)

  if (deactivateError) {
    return { error: deactivateError.message }
  }

  // Activate the selected portrait
  const { error: activateError } = await supabase
    .from("portraits")
    .update({ is_active: true })
    .eq("id", portraitId)
    .eq("user_id", user.id)

  if (activateError) {
    return { error: activateError.message }
  }

  revalidatePath("/portraits")

  return { success: true }
}

export async function updatePortraitLabel(input: UpdateLabelInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const parsed = updateLabelSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { error } = await supabase
    .from("portraits")
    .update({ label: parsed.data.label })
    .eq("id", parsed.data.portraitId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/portraits")

  return { success: true }
}
