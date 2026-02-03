import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GalleryClient } from "./client"

export default async function GalleryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch all generations for the user, sorted by newest first
  const { data: generations, error } = await supabase
    .from("generations")
    .select("id, keywords, background_count, thumbnail_count, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching generations:", error)
  }

  return <GalleryClient generations={generations || []} />
}
