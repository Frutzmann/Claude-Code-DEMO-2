/**
 * Plan configuration for billing tiers
 * Maps Stripe price IDs to quotas and features
 */

export type PlanId = 'free' | 'pro' | 'agency'

export interface Plan {
  id: PlanId
  name: string
  description: string
  quota: number // generations per month
  priceId: string | null // Stripe price ID (null for free tier)
  priceMonthly: number // price in dollars (0 for free)
  features: string[]
}

/**
 * Plan definitions with quotas and features
 * Price IDs come from environment variables set in Stripe Dashboard
 */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with thumbnail generation',
    quota: 5,
    priceId: null,
    priceMonthly: 0,
    features: [
      '5 generations per month',
      '1 portrait',
      'Standard quality',
      'Community support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For content creators who need more',
    quota: 50,
    priceId: process.env.STRIPE_PRICE_PRO || null,
    priceMonthly: 19,
    features: [
      '50 generations per month',
      'Unlimited portraits',
      'HD quality',
      'Priority support',
      'Batch downloads',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    description: 'For teams and agencies',
    quota: 200,
    priceId: process.env.STRIPE_PRICE_AGENCY || null,
    priceMonthly: 49,
    features: [
      '200 generations per month',
      'Unlimited portraits',
      'HD quality',
      'Priority support',
      'Batch downloads',
      'API access (coming soon)',
    ],
  },
}

/**
 * Get plan ID from Stripe price ID
 * Returns 'free' if price ID is null or not found
 */
export function getPlanByPriceId(priceId: string | null): PlanId {
  if (!priceId) return 'free'

  for (const [planId, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return planId as PlanId
    }
  }

  // Default to free if price not recognized
  return 'free'
}

/**
 * Get monthly generation quota for a plan
 */
export function getPlanQuota(planId: PlanId): number {
  return PLANS[planId]?.quota ?? PLANS.free.quota
}

/**
 * Get all available plans as an array (useful for pricing page)
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS)
}

/**
 * Check if a plan has a specific feature
 */
export function planHasFeature(planId: PlanId, feature: string): boolean {
  return PLANS[planId]?.features.includes(feature) ?? false
}
