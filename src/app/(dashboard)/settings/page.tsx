import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getGenerationQuota } from "@/actions/generations"
import { SettingsClient } from "./client"
import { getPlanByPriceId, PLANS } from "@/lib/billing/plans"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch profile, quota, and subscription in parallel
  const [profileResult, quotaResult, subscriptionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
    getGenerationQuota(),
    supabase
      .from("subscriptions")
      .select(`
        id,
        status,
        price_id,
        current_period_end,
        prices (
          id,
          unit_amount,
          currency,
          interval,
          products (
            id,
            name,
            description
          )
        )
      `)
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .single(),
  ])

  const profile = profileResult.data
  const subscription = subscriptionResult.data

  // Determine plan info
  const planId = getPlanByPriceId(subscription?.price_id ?? null)
  const plan = PLANS[planId]

  // Check if user has any subscription (active or past)
  const { data: anySubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  const hasSubscription = !!anySubscription

  return (
    <SettingsClient
      email={user.email ?? ""}
      fullName={profile?.full_name ?? ""}
      plan={plan.name}
      planId={planId}
      used={quotaResult.success ? quotaResult.used : 0}
      limit={quotaResult.success ? quotaResult.limit : 5}
      isAdmin={quotaResult.success ? quotaResult.isAdmin : false}
      periodEnd={quotaResult.success ? quotaResult.periodEnd : null}
      hasSubscription={hasSubscription}
    />
  )
}
