"use client"

import { useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createPortalSession } from "@/actions/billing"

interface PortalButtonProps {
  hasSubscription: boolean
}

export function PortalButton({ hasSubscription }: PortalButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Only show for users who have had a subscription
  if (!hasSubscription) {
    return null
  }

  async function handleOpenPortal() {
    setIsLoading(true)
    try {
      const result = await createPortalSession()
      if (result?.error) {
        // Error handling - result only returns on error since success redirects
        console.error(result.error)
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>
          Update payment method, view invoices, or cancel subscription.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleOpenPortal}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="size-4 mr-2" />
          )}
          Manage Subscription
        </Button>
      </CardContent>
    </Card>
  )
}
