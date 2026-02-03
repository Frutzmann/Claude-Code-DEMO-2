import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getGenerationQuota } from "@/actions/generations"
import { GenerateClient } from "./client"

export default async function GeneratePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch portraits and quota in parallel
  const [portraitsResult, quotaResult] = await Promise.all([
    supabase
      .from("portraits")
      .select("id, public_url, label, is_active")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getGenerationQuota(),
  ])

  if (portraitsResult.error) {
    console.error("Error fetching portraits:", portraitsResult.error)
  }

  // Build quota prop from server action result
  const quota =
    quotaResult.success && !quotaResult.isAdmin
      ? {
          used: quotaResult.used,
          limit: quotaResult.limit,
        }
      : null

  return (
    <GenerateClient
      portraits={portraitsResult.data || []}
      isAdmin={quotaResult.success ? quotaResult.isAdmin : false}
      quota={quota}
    />
  )
}
