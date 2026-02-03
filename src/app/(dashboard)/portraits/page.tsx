import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PortraitsClient } from "./client"

export default async function PortraitsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch portraits for the user
  const { data: portraits, error } = await supabase
    .from("portraits")
    .select("id, public_url, label, is_active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching portraits:", error)
  }

  return <PortraitsClient portraits={portraits || []} userId={user.id} />
}
