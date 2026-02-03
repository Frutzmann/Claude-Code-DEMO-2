"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/server"
import { redirect } from "next/navigation"
import { type PlanId } from "@/lib/billing/plans"

// Server-side price ID lookup (env vars not available on client)
const STRIPE_PRICES: Record<Exclude<PlanId, 'free'>, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_AGENCY,
}

/**
 * Create a Stripe Checkout session for subscription upgrade.
 * Redirects user to Stripe-hosted checkout page.
 */
export async function createCheckoutSession(planId: Exclude<PlanId, 'free'>) {
  const priceId = STRIPE_PRICES[planId]

  if (!priceId) {
    return { error: `Price not configured for ${planId} plan. Set STRIPE_PRICE_${planId.toUpperCase()} env var.` }
  }
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get or create Stripe customer
  let { data: customer } = await supabase
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  let stripeCustomerId = customer?.stripe_customer_id

  if (!stripeCustomerId) {
    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    })
    stripeCustomerId = stripeCustomer.id

    // Store customer ID in database
    const { error: upsertError } = await supabase.from("customers").upsert({
      id: user.id,
      stripe_customer_id: stripeCustomerId,
    })

    if (upsertError) {
      console.error("Failed to store customer:", upsertError)
      return { error: "Failed to create billing account" }
    }
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
      },
    },
  })

  if (!session.url) {
    return { error: "Failed to create checkout session" }
  }

  redirect(session.url)
}

/**
 * Create a Stripe Customer Portal session.
 * Redirects user to Stripe-hosted portal for subscription management.
 */
export async function createPortalSession() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get Stripe customer ID
  const { data: customer } = await supabase
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (!customer?.stripe_customer_id) {
    return { error: "No billing account found" }
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })

  redirect(session.url)
}
