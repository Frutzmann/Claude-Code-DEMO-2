import Stripe from 'stripe'

/**
 * Stripe client configured for server-side usage
 * Uses STRIPE_SECRET_KEY environment variable
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Use the latest API version available at build time
  // @ts-expect-error - TypeScript types may lag behind latest API versions
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})
