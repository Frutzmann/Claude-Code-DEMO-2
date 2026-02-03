"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileForm } from "@/components/settings/profile-form"
import { PlanDisplay } from "@/components/settings/plan-display"
import { PortalButton } from "@/components/settings/portal-button"
import type { PlanId } from "@/lib/billing/plans"

interface SettingsClientProps {
  email: string
  fullName: string
  plan: string
  planId: PlanId
  used: number
  limit: number
  isAdmin: boolean
  periodEnd: string | null
  hasSubscription: boolean
}

export function SettingsClient({
  email,
  fullName,
  plan,
  planId,
  used,
  limit,
  isAdmin,
  periodEnd,
  hasSubscription,
}: SettingsClientProps) {
  const searchParams = useSearchParams()

  // Handle checkout result from URL params
  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")

    if (success === "true") {
      toast.success("Subscription activated! Welcome to your new plan.")
      // Clean up URL
      window.history.replaceState({}, "", "/settings")
    } else if (canceled === "true") {
      toast.info("Checkout canceled. No changes were made.")
      // Clean up URL
      window.history.replaceState({}, "", "/settings")
    }
  }, [searchParams])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and subscription.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileForm email={email} fullName={fullName} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <PlanDisplay
            plan={plan}
            planId={planId}
            used={used}
            limit={limit}
            periodEnd={periodEnd}
            isAdmin={isAdmin}
          />
          <PortalButton hasSubscription={hasSubscription} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
