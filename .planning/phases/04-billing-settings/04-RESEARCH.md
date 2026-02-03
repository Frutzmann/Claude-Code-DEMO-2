# Phase 4: Billing & Settings - Research

**Researched:** 2026-02-03
**Domain:** Stripe Subscriptions + Customer Portal + Quota Enforcement + Settings UI
**Confidence:** HIGH

## Summary

This research covers implementing subscription billing with Stripe, quota enforcement based on Stripe billing cycles, and a settings page for account management. The phase implements requirements BILL-01 through BILL-08, SETT-01 through SETT-04, and ADMN-03/ADMN-04.

The architecture follows the **webhook-sync pattern** established in SaaS industry standards:
1. Products and prices are created in Stripe Dashboard (Pro at $19/month, Agency at $49/month)
2. User clicks upgrade, server creates Stripe Checkout session with price ID
3. Stripe handles payment, redirects to success URL
4. Stripe webhook (`checkout.session.completed`) fires to `/api/webhooks/stripe`
5. Webhook handler creates/updates subscription record in Supabase
6. User's quota is determined by their `subscriptions.price_id` linked to plan tier
7. Quota period is based on `current_period_start` and `current_period_end` from Stripe subscription
8. Customer Portal link generated server-side for subscription management

**Key insight:** Don't track "generations remaining" - track "generations used this billing period". The billing period dates come from Stripe subscription, not calendar month. This ensures quota resets correctly when users upgrade mid-cycle or have different billing dates.

**Primary recommendation:** Use Vercel's subscription payment pattern with `customers`, `products`, `prices`, and `subscriptions` tables synced via webhooks. Quota enforcement uses `subscriptions.current_period_start/end` for the billing window, not calendar months.

## Standard Stack

The established libraries/tools for this phase:

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | ^17.x | Stripe Node.js SDK | Official SDK for server-side Stripe operations |

### Supporting (Already in Project)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | ^2.49.1 | Database operations | Storing subscription data |
| `zod` | ^3.24.2 | Validation | Settings form validation |
| `react-hook-form` | ^7.54.2 | Form state | Settings form |
| `sonner` | ^2.0.7 | Toast notifications | Success/error feedback |
| `lucide-react` | ^0.474.0 | Icons | Crown, CreditCard, Settings icons |

### New shadcn/ui Components Needed

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `Separator` | Visual dividers | Settings sections |
| `Tabs` | Settings organization | Profile / Billing tabs |
| `RadioGroup` | Plan selection | Upgrade modal (optional) |
| `AlertDialog` | Confirmation dialogs | Cancel subscription confirmation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Checkout (hosted) | Stripe Elements (embedded) | Checkout is faster to implement, handles all edge cases, PCI compliant out of box |
| Calendar month quota | Billing cycle quota | Billing cycle is more accurate, handles mid-month upgrades correctly |
| Metered billing | Fixed tier quotas | Fixed tiers simpler for MVP, metered adds complexity |
| `stripe` SDK | Direct API calls | SDK handles auth, retries, types - no reason to hand-roll |

**Installation:**

```bash
# New dependency
npm install stripe

# New shadcn/ui components
npx shadcn@latest add separator tabs radio-group alert-dialog
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── settings/
│   │       ├── page.tsx           # Server: fetch profile, subscription
│   │       └── client.tsx         # Client: tabs, forms, portal link
│   └── api/
│       └── webhooks/
│           └── stripe/
│               └── route.ts       # Stripe webhook handler
├── actions/
│   ├── billing.ts                 # Create checkout, portal sessions
│   └── settings.ts                # Update profile actions
├── components/
│   └── settings/
│       ├── profile-form.tsx       # Display name editor
│       ├── plan-display.tsx       # Current plan + usage
│       ├── upgrade-button.tsx     # Checkout redirect
│       └── portal-button.tsx      # Customer portal link
├── lib/
│   ├── stripe/
│   │   └── server.ts              # Stripe client singleton
│   └── billing/
│       └── plans.ts               # Plan definitions, quota lookup
└── types/
    └── database.ts                # Add subscription types
```

### Pattern 1: Database Schema for Billing

**What:** Four tables to sync Stripe data and track subscriptions.
**When to use:** All billing features.

```sql
-- Migration: 006_billing.sql

-- Customers table: links Supabase user to Stripe customer
CREATE TABLE customers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- No user SELECT policy - customers table is private (service role only)

-- Products table: synced from Stripe
CREATE TABLE products (
  id TEXT PRIMARY KEY,                     -- Stripe product ID (prod_xxx)
  active BOOLEAN,
  name TEXT,
  description TEXT,
  image TEXT,
  metadata JSONB
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access" ON products FOR SELECT USING (true);

-- Prices table: synced from Stripe
CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');

CREATE TABLE prices (
  id TEXT PRIMARY KEY,                     -- Stripe price ID (price_xxx)
  product_id TEXT REFERENCES products(id),
  active BOOLEAN,
  description TEXT,
  unit_amount BIGINT,                      -- Amount in cents (1900 = $19)
  currency TEXT CHECK (char_length(currency) = 3),
  type pricing_type,
  interval pricing_plan_interval,
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB
);

ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access" ON prices FOR SELECT USING (true);

-- Subscriptions table: user's active subscription
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'canceled', 'incomplete',
  'incomplete_expired', 'past_due', 'unpaid', 'paused'
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,                     -- Stripe subscription ID (sub_xxx)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status subscription_status,
  metadata JSONB,
  price_id TEXT REFERENCES prices(id),
  quantity INTEGER,
  cancel_at_period_end BOOLEAN,
  created TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Index for efficient quota queries
CREATE INDEX subscriptions_user_status_idx ON subscriptions(user_id, status);
CREATE INDEX subscriptions_price_idx ON subscriptions(price_id);
```

### Pattern 2: Plan Configuration

**What:** Define plan tiers with quotas, linked to Stripe price IDs.
**When to use:** Quota checks, plan display, upgrade flows.

```typescript
// lib/billing/plans.ts

export const PLANS = {
  free: {
    name: 'Free',
    quota: 5,
    priceId: null, // No Stripe price for free tier
    features: [
      '5 generations per month',
      'Basic thumbnails',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    quota: 50,
    priceId: process.env.STRIPE_PRICE_PRO!, // price_xxx from Stripe
    priceMonthly: 19,
    features: [
      '50 generations per month',
      'Priority processing',
      'Email support',
    ],
  },
  agency: {
    name: 'Agency',
    quota: 200,
    priceId: process.env.STRIPE_PRICE_AGENCY!, // price_xxx from Stripe
    priceMonthly: 49,
    features: [
      '200 generations per month',
      'Priority processing',
      'Priority support',
      'Team collaboration (coming soon)',
    ],
  },
} as const

export type PlanId = keyof typeof PLANS

export function getPlanByPriceId(priceId: string | null): PlanId {
  if (!priceId) return 'free'

  for (const [planId, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return planId as PlanId
    }
  }

  return 'free'
}

export function getPlanQuota(planId: PlanId): number {
  return PLANS[planId].quota
}
```

### Pattern 3: Quota Check with Billing Period

**What:** Check usage against quota using Stripe billing period, not calendar month.
**When to use:** Before creating generation, displaying usage.

```typescript
// Updated actions/generations.ts

import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { getPlanByPriceId, getPlanQuota } from "@/lib/billing/plans"

export async function getGenerationQuota() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const adminUser = isAdmin(user.email)

  if (adminUser) {
    return {
      success: true,
      used: 0, // Not relevant for admin
      limit: Infinity,
      isAdmin: true,
      plan: 'admin',
      periodEnd: null,
    }
  }

  // Get active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('price_id, current_period_start, current_period_end, status')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .single()

  // Determine plan and period
  const plan = getPlanByPriceId(subscription?.price_id ?? null)
  const quota = getPlanQuota(plan)

  // For free users or no subscription: use calendar month
  // For subscribers: use Stripe billing period
  let periodStart: Date
  let periodEnd: Date | null = null

  if (subscription?.current_period_start && subscription?.current_period_end) {
    periodStart = new Date(subscription.current_period_start)
    periodEnd = new Date(subscription.current_period_end)
  } else {
    // Free tier: use calendar month
    periodStart = new Date()
    periodStart.setDate(1)
    periodStart.setHours(0, 0, 0, 0)
  }

  // Count generations in current period
  const { count, error: countError } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', periodStart.toISOString())

  if (countError) {
    return { error: "Failed to check quota" }
  }

  return {
    success: true,
    used: count ?? 0,
    limit: quota,
    isAdmin: false,
    plan,
    periodEnd: periodEnd?.toISOString() ?? null,
  }
}
```

### Pattern 4: Stripe Checkout Session Creation

**What:** Create a Stripe Checkout session for subscription upgrade.
**When to use:** User clicks upgrade button.

```typescript
// actions/billing.ts
"use server"

import Stripe from 'stripe'
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Get or create Stripe customer
  let { data: customer } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', user.id)
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

    // Store customer ID
    await supabase
      .from('customers')
      .upsert({ id: user.id, stripe_customer_id: stripeCustomerId })
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
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

export async function createPortalSession() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Get Stripe customer ID
  const { data: customer } = await supabase
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', user.id)
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
```

### Pattern 5: Stripe Webhook Handler

**What:** Process Stripe events to sync subscription data.
**When to use:** Checkout completed, subscription updated/deleted.

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role for webhook processing
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
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

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
    return NextResponse.json({ received: true })
  }

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

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          await upsertSubscription(subscription)
        }
        break

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
  await supabase.from('products').upsert({
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  })
}

async function upsertPrice(price: Stripe.Price) {
  await supabase.from('prices').upsert({
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
}

async function upsertSubscription(subscription: Stripe.Subscription) {
  // Get user ID from subscription metadata or customer
  const userId = subscription.metadata.supabase_user_id
    || await getUserIdFromCustomer(subscription.customer as string)

  if (!userId) {
    console.error('No user ID found for subscription:', subscription.id)
    return
  }

  await supabase.from('subscriptions').upsert({
    id: subscription.id,
    user_id: userId,
    status: subscription.status,
    metadata: subscription.metadata,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    ended_at: subscription.ended_at
      ? new Date(subscription.ended_at * 1000).toISOString()
      : null,
    cancel_at: subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  })
}

async function deleteSubscription(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', ended_at: new Date().toISOString() })
    .eq('id', subscription.id)
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  return data?.id ?? null
}
```

### Pattern 6: Settings Page with Billing

**What:** Settings page showing profile, plan, usage, and upgrade options.
**When to use:** `/settings` route.

```typescript
// app/(dashboard)/settings/page.tsx
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { getGenerationQuota } from "@/actions/generations"
import { SettingsClient } from "./client"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, quotaResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single(),
    getGenerationQuota(),
  ])

  const adminUser = isAdmin(user.email)

  // Get subscription for paid users
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      price_id,
      current_period_end,
      cancel_at_period_end,
      prices (
        unit_amount,
        interval,
        products (name)
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .single()

  return (
    <SettingsClient
      profile={{
        fullName: profile?.full_name ?? '',
        email: profile?.email ?? user.email ?? '',
      }}
      quota={quotaResult.success ? {
        used: quotaResult.used,
        limit: quotaResult.limit,
        plan: quotaResult.plan,
        periodEnd: quotaResult.periodEnd,
      } : null}
      subscription={subscription}
      isAdmin={adminUser}
    />
  )
}
```

### Anti-Patterns to Avoid

- **Storing quota count in database:** Recalculate from generations table - avoids sync issues
- **Using calendar month for paid users:** Use Stripe billing period for accurate quota reset
- **Skipping webhook signature verification:** Security risk - always verify
- **Polling Stripe for subscription status:** Use webhooks for real-time sync
- **Trusting client-side price data:** Always use server-side price lookup for checkout
- **Deleting subscriptions on cancel:** Update status to "canceled" - Stripe keeps the record
- **Forgetting to handle subscription.updated:** Missed upgrades/downgrades

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment form | Custom card inputs | Stripe Checkout | PCI compliance, edge cases, fraud detection |
| Subscription management UI | Custom forms | Stripe Customer Portal | Handles all edge cases, cancel/update/payment method |
| Webhook signature verification | Manual HMAC | `stripe.webhooks.constructEvent()` | Timing-safe, handles replay attacks |
| Billing period tracking | Manual date math | Stripe subscription `current_period_*` | Handles proration, upgrades, trials |
| Plan change proration | Manual calculation | Stripe proration | Complex edge cases handled |
| Payment retry logic | Custom scheduler | Stripe automatic retries | Configurable, handles dunning |

**Key insight:** Stripe Checkout and Customer Portal handle 90% of billing UI for free. Custom payment forms are almost never worth the PCI compliance burden.

## Common Pitfalls

### Pitfall 1: Webhook Not Receiving Events

**What goes wrong:** Stripe webhook fires but `/api/webhooks/stripe` returns 401/403.
**Why it happens:** Middleware protects API routes, or webhook secret is wrong.
**How to avoid:**
1. Exclude `/api/webhooks` from auth middleware (already done for n8n)
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
**Warning signs:** Webhook events show as failed in Stripe Dashboard.

### Pitfall 2: Subscription Data Out of Sync

**What goes wrong:** User upgrades but quota doesn't increase, or canceled but still has access.
**Why it happens:** Webhook handler error, or only listening to `checkout.session.completed`.
**How to avoid:**
1. Listen to ALL subscription events: `created`, `updated`, `deleted`
2. Use upsert pattern for idempotency
3. Log webhook errors, monitor Stripe Dashboard
**Warning signs:** User complaints about wrong plan showing, manual database fixes needed.

### Pitfall 3: Free Tier Users Showing Wrong Quota Period

**What goes wrong:** Free users see "quota resets on [wrong date]".
**Why it happens:** Using subscription billing period for users without subscription.
**How to avoid:**
```typescript
// Free tier: use calendar month
if (!subscription?.current_period_start) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  periodStart = startOfMonth
}
```
**Warning signs:** Free users confused about when quota resets.

### Pitfall 4: Customer Created Multiple Times

**What goes wrong:** Same user has multiple Stripe customers, subscriptions fail.
**Why it happens:** Race condition in customer creation, no upsert.
**How to avoid:**
1. Use database upsert for customer record
2. Always check for existing customer before creating
3. Use idempotency keys for Stripe API calls
**Warning signs:** Duplicate customer records in Stripe Dashboard.

### Pitfall 5: Admin Still Sees Upgrade Prompts

**What goes wrong:** Admin user sees "5/5 generations" and upgrade CTAs.
**Why it happens:** Admin check not applied consistently across all components.
**How to avoid:**
1. Pass `isAdmin` flag from server to client
2. In every quota display component, check `isAdmin` first
3. Admin badge: "Admin - Unlimited" instead of quota counter
**Warning signs:** Admin complaining about UI, or worse - admin hits quota limit.

### Pitfall 6: Checkout Session Created Without Customer Metadata

**What goes wrong:** Webhook can't find Supabase user for new subscription.
**Why it happens:** Forgot to add `supabase_user_id` to subscription metadata.
**How to avoid:**
```typescript
const session = await stripe.checkout.sessions.create({
  // ...
  subscription_data: {
    metadata: {
      supabase_user_id: user.id, // REQUIRED
    },
  },
})
```
**Warning signs:** Subscriptions created but user_id is null, manual fixes needed.

## Code Examples

### Plan Display Component

```typescript
// components/settings/plan-display.tsx
"use client"

import { Crown, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PLANS, type PlanId } from "@/lib/billing/plans"
import { createCheckoutSession } from "@/actions/billing"
import { formatDistanceToNow } from "date-fns"

interface PlanDisplayProps {
  plan: PlanId | 'admin'
  used: number
  limit: number
  periodEnd: string | null
  isAdmin: boolean
}

export function PlanDisplay({ plan, used, limit, periodEnd, isAdmin }: PlanDisplayProps) {
  if (isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-5 text-yellow-500" />
            Admin - Unlimited
          </CardTitle>
          <CardDescription>
            You have unlimited access to all features.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const planConfig = PLANS[plan as PlanId]
  const usagePercent = Math.min((used / limit) * 100, 100)
  const isOverQuota = used >= limit

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            {planConfig.name} Plan
          </CardTitle>
          {plan !== 'free' && (
            <Badge variant="secondary">
              ${planConfig.priceMonthly}/month
            </Badge>
          )}
        </div>
        <CardDescription>
          {periodEnd
            ? `Resets ${formatDistanceToNow(new Date(periodEnd), { addSuffix: true })}`
            : 'Resets at the start of each month'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Generations this period</span>
            <span className={isOverQuota ? 'text-destructive font-medium' : ''}>
              {used} / {limit}
            </span>
          </div>
          <Progress value={usagePercent} className={isOverQuota ? '[&>div]:bg-destructive' : ''} />
        </div>

        {isOverQuota && (
          <p className="text-sm text-destructive">
            You've reached your monthly limit. Upgrade to continue generating.
          </p>
        )}

        {plan === 'free' && (
          <div className="flex gap-2">
            <Button
              onClick={() => createCheckoutSession(PLANS.pro.priceId!)}
              className="flex-1"
            >
              Upgrade to Pro
            </Button>
            <Button
              onClick={() => createCheckoutSession(PLANS.agency.priceId!)}
              variant="outline"
            >
              Agency
            </Button>
          </div>
        )}

        {plan === 'pro' && (
          <Button
            onClick={() => createCheckoutSession(PLANS.agency.priceId!)}
            className="w-full"
          >
            Upgrade to Agency
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

### Profile Form Component

```typescript
// components/settings/profile-form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTransition } from "react"
import { updateProfile } from "@/actions/settings"

const profileSchema = z.object({
  fullName: z.string().min(1, "Name is required").max(100),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: {
    fullName: string
    email: string
  }
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName,
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    startTransition(async () => {
      const result = await updateProfile(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Profile updated")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage your account information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Display Name</Label>
            <Input
              {...form.register("fullName")}
              id="fullName"
              disabled={isPending}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### Portal Button Component

```typescript
// components/settings/portal-button.tsx
"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink, Loader2 } from "lucide-react"
import { useTransition } from "react"
import { createPortalSession } from "@/actions/billing"

interface PortalButtonProps {
  hasSubscription: boolean
}

export function PortalButton({ hasSubscription }: PortalButtonProps) {
  const [isPending, startTransition] = useTransition()

  if (!hasSubscription) {
    return null
  }

  const handleClick = () => {
    startTransition(async () => {
      await createPortalSession()
    })
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin mr-2" />
          Loading...
        </>
      ) : (
        <>
          <ExternalLink className="size-4 mr-2" />
          Manage Subscription
        </>
      )}
    </Button>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom payment forms | Stripe Checkout (hosted) | Always preferred | PCI compliance handled, faster implementation |
| Store quota remaining | Calculate from generations count | Best practice | Avoids sync issues, single source of truth |
| Calendar month quota | Billing cycle quota | Stripe best practice | Accurate for mid-month signups, upgrades |
| Poll Stripe for status | Webhook-driven sync | Always preferred | Real-time updates, no rate limits |
| `subscription.current_period_*` at top level | `subscription.items.data[0].current_period_*` | Stripe API 2025-03-31 | Items have their own billing periods |

**Deprecated/outdated:**
- Stripe Charges API: Use PaymentIntents
- Client-side price creation: Always create prices in Dashboard or via API with secret key
- `subscription.plan`: Use `subscription.items.data[0].price` instead

## Open Questions

Things that couldn't be fully resolved:

1. **Trial Period Strategy**
   - What we know: Stripe supports trial periods on prices
   - What's unclear: Should Pro/Agency have free trials?
   - Recommendation: Skip trials for MVP, easy to add later via Stripe price config

2. **Proration on Plan Changes**
   - What we know: Stripe handles proration automatically
   - What's unclear: User UX when upgrading mid-cycle
   - Recommendation: Let Stripe handle, show prorated amount in Customer Portal

3. **Failed Payment Handling**
   - What we know: Stripe has dunning management and automatic retries
   - What's unclear: When to restrict access for past_due subscriptions?
   - Recommendation: Allow continued access during `past_due`, restrict on `unpaid`

4. **Quota Overflow on Downgrade**
   - What we know: User might have used 150 generations on Agency, then downgrade to Pro
   - What's unclear: Should they be blocked until next cycle?
   - Recommendation: Allow continued use of already-generated content, just block new generations

## Sources

### Primary (HIGH confidence)
- [Stripe Checkout Quickstart (Next.js)](https://docs.stripe.com/checkout/quickstart?client=next) - Official integration guide
- [Stripe Customer Portal Integration](https://docs.stripe.com/customer-management/integrate-customer-portal) - Portal session creation
- [Stripe Subscription Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) - Event handling patterns
- [Stripe Subscription Object](https://docs.stripe.com/api/subscriptions/object) - Fields reference
- [Vercel Next.js Subscription Payments](https://github.com/vercel/nextjs-subscription-payments) - Database schema, webhook patterns

### Secondary (MEDIUM confidence)
- [Stripe + Next.js 15 Complete Guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) - Implementation patterns
- [Stripe Integration for Next.js 15 with Supabase](https://dev.to/flnzba/33-stripe-integration-guide-for-nextjs-15-with-supabase-13b5) - Supabase-specific patterns
- [Makerkit Stripe Webhooks](https://makerkit.dev/docs/next-supabase/payments/stripe-webhooks) - Webhook best practices

### Tertiary (LOW confidence)
- WebSearch patterns for shadcn/ui settings pages - marked for validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Stripe SDK, established patterns
- Database schema: HIGH - Directly from Vercel's official template
- Webhook handling: HIGH - Official Stripe documentation
- Quota enforcement: HIGH - Clear logic based on Stripe billing periods
- Settings UI: MEDIUM - shadcn/ui patterns, may need adjustments

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - Stripe APIs stable, patterns established)
