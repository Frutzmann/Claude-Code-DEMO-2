"use client"

import { useState } from "react"
import { Crown, Loader2, Zap } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createCheckoutSession } from "@/actions/billing"
import { PLANS, type PlanId } from "@/lib/billing/plans"

interface PlanDisplayProps {
  plan: string
  planId: PlanId
  used: number
  limit: number
  periodEnd: string | null
  isAdmin: boolean
}

export function PlanDisplay({
  plan,
  planId,
  used,
  limit,
  periodEnd,
  isAdmin,
}: PlanDisplayProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)

  const usagePercent = isAdmin ? 0 : Math.min((used / limit) * 100, 100)
  const isOverQuota = !isAdmin && used >= limit

  async function handleUpgrade(targetPlanId: Exclude<PlanId, 'free'>) {
    setLoadingPlan(targetPlanId)
    try {
      const result = await createCheckoutSession(targetPlanId)
      if (result?.error) {
        // Error handling - result only returns on error since success redirects
        console.error(result.error)
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error)
    } finally {
      setLoadingPlan(null)
    }
  }

  // Admin display
  if (isAdmin) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="size-5 text-yellow-500" />
            <CardTitle>Admin - Unlimited</CardTitle>
          </div>
          <CardDescription>
            You have unlimited access to all features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
            <Crown className="size-3 mr-1" />
            Administrator
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Plan</CardTitle>
        <CardDescription>
          Manage your subscription and usage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{plan} Plan</p>
            {periodEnd && (
              <p className="text-sm text-muted-foreground">
                Renews {formatDistanceToNow(new Date(periodEnd), { addSuffix: true })}
              </p>
            )}
            {!periodEnd && planId === "free" && (
              <p className="text-sm text-muted-foreground">
                Resets at the start of each month
              </p>
            )}
          </div>
          <Badge variant={planId === "free" ? "secondary" : "default"}>
            {plan}
          </Badge>
        </div>

        {/* Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly Generations</span>
            <span className={isOverQuota ? "text-destructive font-medium" : ""}>
              {used} / {limit}
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          {isOverQuota && (
            <p className="text-sm text-destructive">
              You&apos;ve reached your monthly limit. Upgrade to continue generating thumbnails.
            </p>
          )}
        </div>

        {/* Upgrade buttons */}
        {planId === "free" && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => handleUpgrade("pro")}
              disabled={loadingPlan !== null}
              className="flex-1"
            >
              {loadingPlan === "pro" ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Zap className="size-4 mr-2" />
              )}
              Upgrade to Pro - ${PLANS.pro.priceMonthly}/mo
            </Button>
            <Button
              onClick={() => handleUpgrade("agency")}
              disabled={loadingPlan !== null}
              variant="outline"
              className="flex-1"
            >
              {loadingPlan === "agency" && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              Agency - ${PLANS.agency.priceMonthly}/mo
            </Button>
          </div>
        )}

        {planId === "pro" && (
          <div className="pt-2">
            <Button
              onClick={() => handleUpgrade("agency")}
              disabled={loadingPlan !== null}
              variant="outline"
            >
              {loadingPlan === "agency" && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              Upgrade to Agency - ${PLANS.agency.priceMonthly}/mo
            </Button>
          </div>
        )}

        {/* Features list */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Plan Features</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {PLANS[planId].features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-muted-foreground" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
