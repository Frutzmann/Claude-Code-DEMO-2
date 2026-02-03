import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin"
import { FREE_TIER_MONTHLY_QUOTA } from "@/lib/validations/generations"
import { GenerateClient } from "./client"

export default async function GeneratePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch portraits for the selector
  const { data: portraits, error: portraitsError } = await supabase
    .from("portraits")
    .select("id, public_url, label, is_active")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (portraitsError) {
    console.error("Error fetching portraits:", portraitsError)
  }

  // Calculate quota for this month
  const adminUser = isAdmin(user.email)

  let quota = null
  if (!adminUser) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count, error: countError } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())

    if (!countError) {
      quota = {
        used: count ?? 0,
        limit: FREE_TIER_MONTHLY_QUOTA,
      }
    }
  }

  return (
    <GenerateClient
      portraits={portraits || []}
      isAdmin={adminUser}
      quota={quota}
    />
  )
}
