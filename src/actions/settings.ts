"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Update the current user's profile.
 */
export async function updateProfile({ fullName }: { fullName: string }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Validate fullName
  const trimmedName = fullName.trim()
  if (trimmedName.length < 1 || trimmedName.length > 100) {
    return { error: "Name must be between 1 and 100 characters" }
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: trimmedName })
    .eq("id", user.id)

  if (error) {
    console.error("Failed to update profile:", error)
    return { error: "Failed to update profile" }
  }

  revalidatePath("/settings")

  return { success: true }
}
