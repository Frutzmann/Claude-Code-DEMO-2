import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'

// Use service role client for webhook processing (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'product.created',
  'product.updated',
  'price.created',
  'price.updated',
])

export async function POST(request: NextRequest) {
  console.log('[Stripe Webhook] ===== REQUEST RECEIVED =====')
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  console.log('[Stripe Webhook] Signature present:', !!signature)

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!relevantEvents.has(event.type)) {
    console.log('[Stripe Webhook] Skipping event:', event.type)
    return NextResponse.json({ received: true })
  }

  console.log('[Stripe Webhook] Processing event:', event.type)

  try {
    switch (event.type) {
      case 'product.created':
      case 'product.updated':
        await upsertProduct(event.data.object as Stripe.Product)
        break

      case 'price.created':
      case 'price.updated':
        await upsertPrice(event.data.object as Stripe.Price)
        break

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            { expand: ['items.data.price.product'] }
          )
          // Ensure product and price exist before creating subscription
          const price = subscription.items.data[0].price
          const product = price.product as Stripe.Product
          await upsertProduct(product)
          await upsertPrice(price)
          await upsertSubscription(subscription)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await upsertSubscription(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await deleteSubscription(event.data.object as Stripe.Subscription)
        break
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function upsertProduct(product: Stripe.Product) {
  const { error } = await supabase.from('products').upsert({
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  })

  if (error) {
    console.error('Failed to upsert product:', error)
    throw error
  }
}

async function upsertPrice(price: Stripe.Price) {
  const { error } = await supabase.from('prices').upsert({
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : price.product.id,
    active: price.active,
    description: price.nickname,
    unit_amount: price.unit_amount,
    currency: price.currency,
    type: price.type,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  })

  if (error) {
    console.error('Failed to upsert price:', error)
    throw error
  }
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Upserting subscription:', subscription.id)
  console.log('[Stripe Webhook] Subscription metadata:', subscription.metadata)
  console.log('[Stripe Webhook] Customer ID:', subscription.customer)

  // Get user ID from subscription metadata or customer lookup
  const userId = subscription.metadata.supabase_user_id
    || await getUserIdFromCustomer(subscription.customer as string)

  console.log('[Stripe Webhook] Resolved user ID:', userId)

  if (!userId) {
    console.error('No user ID found for subscription:', subscription.id)
    return
  }

  // Type assertion for subscription fields that exist in API but may lag in TypeScript types
  const sub = subscription as Stripe.Subscription & {
    current_period_start: number
    current_period_end: number
  }

  const { error } = await supabase.from('subscriptions').upsert({
    id: sub.id,
    user_id: userId,
    status: sub.status,
    metadata: sub.metadata,
    price_id: sub.items.data[0].price.id,
    quantity: sub.items.data[0].quantity,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    ended_at: sub.ended_at
      ? new Date(sub.ended_at * 1000).toISOString()
      : null,
    cancel_at: sub.cancel_at
      ? new Date(sub.cancel_at * 1000).toISOString()
      : null,
    canceled_at: sub.canceled_at
      ? new Date(sub.canceled_at * 1000).toISOString()
      : null,
    trial_start: sub.trial_start
      ? new Date(sub.trial_start * 1000).toISOString()
      : null,
    trial_end: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
  })

  if (error) {
    console.error('Failed to upsert subscription:', error)
    throw error
  }

  console.log('[Stripe Webhook] Subscription upserted successfully for user:', userId)
}

async function deleteSubscription(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  if (error) {
    console.error('Failed to delete subscription:', error)
    throw error
  }
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (error) {
    console.error('Failed to lookup customer:', error)
    return null
  }

  return data?.id ?? null
}
