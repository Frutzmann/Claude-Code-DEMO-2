# Stack Research: YouTube Thumbnail Factory SaaS

**Project:** YouTube Thumbnail Factory - SaaS for AI-powered thumbnail generation
**Researched:** 2026-02-03
**Overall Confidence:** HIGH

---

## Executive Summary

This document prescribes the technology stack for building a Next.js 15 SaaS application with Supabase for auth/database/storage, Stripe for subscriptions, and webhook-based AI integrations. The recommendations are based on the established 2026 ecosystem patterns, prioritizing developer experience, type safety, and production readiness.

The core philosophy: **Minimize dependencies, maximize type safety, leverage Server Components and Server Actions.**

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Next.js** | 16.x (App Router) | Full-stack React framework | Industry standard for React SSR/SSG. App Router is mature with React 19 support. Vercel-optimized deployment. | HIGH |
| **React** | 19.x | UI library | Bundled with Next.js 16. Server Components and Actions are stable. | HIGH |
| **TypeScript** | 5.7+ | Type safety | Default for modern Next.js. Strict mode recommended. TypeScript 7.0 (Go-based) coming mid-2026. | HIGH |

### Authentication & Database

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Supabase Auth** | Latest (@supabase/ssr) | Authentication | Native integration with Supabase ecosystem. SSR-ready with @supabase/ssr package. Supports OAuth, magic links, email/password. Free tier up to 50k MAU. | HIGH |
| **Supabase Database** | PostgreSQL 15+ | Primary database | Row-Level Security (RLS) for multi-tenant data isolation. Real-time subscriptions. Tight auth integration. | HIGH |
| **Supabase Storage** | Latest | File storage | Already in ecosystem. Signed URLs for direct uploads bypass Next.js body size limits. RLS policies for access control. | HIGH |

**Note on Auth alternatives:** NextAuth.js (Auth.js) development team joined Better Auth in September 2025. For Supabase-centric stacks, Supabase Auth is the recommended choice - it eliminates the need for a separate auth system and couples well with RLS policies.

### Payments

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Stripe** | stripe@latest | Subscriptions & payments | Industry standard. Checkout handles compliance. Customer Portal for self-service. Webhooks for subscription lifecycle. | HIGH |
| **stripe (npm)** | ^17.x | Server-side SDK | Official Node.js library. Type-safe. | HIGH |
| **@stripe/stripe-js** | ^5.x | Client-side SDK | For Stripe Elements if needed (checkout is hosted). | MEDIUM |

### Styling & UI

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Tailwind CSS** | 4.x | Utility-first CSS | 5x faster builds, CSS-first config (no tailwind.config.js needed). Auto content detection. | HIGH |
| **shadcn/ui** | Latest | Component library | Not a dependency - copy components into codebase. Built on Radix UI primitives. Full control, accessible, Tailwind-styled. Used by OpenAI, Adobe, Vercel. | HIGH |
| **Lucide React** | ^0.560+ | Icons | Tree-shakable SVG icons. Default for shadcn/ui. ~1500 icons. | HIGH |
| **Sonner** | ^2.x | Toast notifications | Integrated with shadcn/ui. Minimal config, promise-based, 11.5k GitHub stars. | HIGH |

### Forms & Validation

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **React Hook Form** | ^7.60+ | Form state management | Minimal re-renders, uncontrolled components. Works with Server Actions via `action` prop. | HIGH |
| **Zod** | ^3.25+ | Schema validation | TypeScript-first. Same schema works on client AND server. Standard Schema compatible. | HIGH |
| **@hookform/resolvers** | ^5.x | RHF + Zod bridge | Official resolver package. | HIGH |

### Data Fetching & State

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Server Actions** | Built-in | Mutations | First-class Next.js feature. No API routes needed for mutations. Type-safe with next-safe-action. | HIGH |
| **TanStack Query** | ^5.x | Client-side data/cache | For client-side needs: infinite scroll, optimistic updates, background sync. Pairs with Server Actions for mutations. | HIGH |
| **nuqs** | ^2.x | URL state | Type-safe search params. Like useState but in URL. 6kb gzipped. Used by Sentry, Supabase, Vercel. | HIGH |

### Server Action Safety

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **next-safe-action** | ^8.x | Type-safe Server Actions | End-to-end type safety. Input validation with Zod/Valibot. Middleware support. Form Actions support. | HIGH |

### Email

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Resend** | resend@latest | Transactional email | Developer-first API. Works with Server Actions. Free tier: 100 emails/day. | HIGH |
| **React Email** | @react-email/components | Email templates | Build emails with React components. Pairs with Resend. | MEDIUM |

### Database ORM (Optional)

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Drizzle ORM** | ^0.40+ | Type-safe queries | SQL-first, zero runtime overhead (~7.4kb). Excellent serverless/edge support. Native Supabase compatibility. Recommended over Prisma for new projects in 2026. | HIGH |

**Note:** Supabase's JavaScript client (`@supabase/supabase-js`) provides sufficient querying for most SaaS apps. Drizzle is optional but valuable for complex queries, migrations, and when you want SQL-like control with full type safety.

### Hosting & Infrastructure

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| **Vercel** | Pro plan recommended | Hosting | Native Next.js optimization. Edge functions. Pro: 1M invocations, 10M edge requests, 1TB bandwidth. $20/user/month. | HIGH |
| **Supabase Cloud** | Free/Pro | BaaS | Managed PostgreSQL + Auth + Storage + Realtime. Free tier generous for MVP. | HIGH |

---

## Package Recommendations

### Core Dependencies

```bash
# Framework
npm install next@latest react@latest react-dom@latest

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Stripe
npm install stripe @stripe/stripe-js

# UI
npm install tailwindcss@latest
npx shadcn@latest init
npm install lucide-react sonner

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Data & State
npm install @tanstack/react-query nuqs

# Server Actions
npm install next-safe-action

# Email (optional)
npm install resend @react-email/components

# Database ORM (optional)
npm install drizzle-orm
```

### Dev Dependencies

```bash
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D eslint eslint-config-next
npm install -D prettier prettier-plugin-tailwindcss
npm install -D drizzle-kit # If using Drizzle
```

### Specific Versions (as of 2026-02-03)

| Package | Recommended Version | Notes |
|---------|---------------------|-------|
| next | ^16.1.6 | Latest stable |
| react | ^19.x | Bundled with Next.js 16 |
| typescript | ^5.7.x | Strict mode enabled |
| @supabase/supabase-js | ^2.x | Latest v2 |
| @supabase/ssr | ^0.6+ | SSR auth helper |
| stripe | ^17.x | Node.js SDK |
| tailwindcss | ^4.1+ | CSS-first config |
| zod | ^3.25+ | Latest v3 |
| react-hook-form | ^7.60+ | Latest v7 |
| @tanstack/react-query | ^5.x | Latest v5 |
| nuqs | ^2.x | Requires Next.js >=14.2 |
| next-safe-action | ^8.x | Latest v8 |
| sonner | ^2.x | Latest |
| lucide-react | ^0.560+ | Latest |
| drizzle-orm | ^0.40+ | If using |

---

## What NOT to Use (Anti-Recommendations)

### Authentication

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| **NextAuth.js / Auth.js** for new projects | Development team joined Better Auth (Sept 2025). Ecosystem churn risk. Operational burden with edge/middleware. | Supabase Auth (when using Supabase) or Better Auth |
| **Firebase Auth** | Vendor lock-in. Less PostgreSQL-native than Supabase. | Supabase Auth |
| **Rolling your own auth** | Security risk. Time sink. Undifferentiated work. | Supabase Auth |

### Database & ORM

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| **Prisma** for new projects | Heavier runtime, slower serverless cold starts (improving but still larger). Drizzle is more serverless-native. | Drizzle ORM or raw Supabase client |
| **MongoDB** | PostgreSQL + Supabase is better for relational SaaS data with RLS. | Supabase PostgreSQL |
| **Serverless SQL (PlanetScale)** | MySQL-based, less PostgreSQL feature parity. Supabase is a more complete solution. | Supabase |

### UI & Styling

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| **Tailwind CSS v3** | v4 is faster, simpler config, CSS-first. No reason to use v3 in new projects. | Tailwind CSS v4 |
| **Material UI (MUI)** | Heavy bundle size. Different design language than shadcn/ui. Harder to customize. | shadcn/ui |
| **Chakra UI** | Less popular in 2026. shadcn/ui has won the ecosystem. | shadcn/ui |
| **CSS-in-JS (styled-components, Emotion)** | Runtime overhead. Server Components complications. Tailwind is faster. | Tailwind CSS |
| **Font Awesome** | Paid for full set. Lucide is free, tree-shakable, lighter. | Lucide React |

### Forms

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| **Formik** | Older, more verbose. React Hook Form has better performance and DX. | React Hook Form |
| **Yup** | Zod has better TypeScript inference. Same validation on client/server. | Zod |
| **Manual form state with useState** | Reinventing the wheel. More re-renders. | React Hook Form |

### State Management

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| **Redux** | Overkill for most SaaS apps. Server state belongs in TanStack Query. | TanStack Query + Server Actions |
| **Zustand** for server state | TanStack Query handles caching, deduping, background sync better. | TanStack Query |
| **Custom useState for URL params** | Tedious, error-prone. nuqs is type-safe and battle-tested. | nuqs |

### API & Data Fetching

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| **API routes for all mutations** | Server Actions are simpler, type-safe, colocated with components. | Server Actions |
| **tRPC** | Adds complexity when Server Actions + next-safe-action cover most cases. | next-safe-action + Server Actions |
| **SWR** | TanStack Query has more features (mutations, infinite queries, devtools). | TanStack Query |

### File Uploads

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| **Next.js body parser for large files** | 1MB default limit. DDoS risk if increased. | Supabase Storage signed URLs |
| **UploadThing** (when already using Supabase) | Adds another service when Supabase Storage is already available. | Supabase Storage |

### Hosting

| Don't Use | Why | Use Instead |
|-----------|-----|-------------|
| **Self-hosting Next.js** (unless required) | Vercel is optimized for Next.js. Edge functions, preview deploys, analytics built-in. | Vercel |
| **Netlify** for Next.js | Vercel has better Next.js support (they build it). | Vercel |
| **AWS Amplify** | More complex setup. Vercel is simpler for Next.js. | Vercel |

---

## Integration Patterns

### 1. Authentication Flow

```
User lands on app
    ↓
Supabase Auth (OAuth/Magic Link/Email)
    ↓
@supabase/ssr handles cookies (middleware refreshes tokens)
    ↓
Server Components read session via supabase.auth.getClaims()
    ↓
RLS policies enforce data access at database level
```

**Key Pattern:** Use `supabase.auth.getClaims()` in Server Components (not `getSession()`). Claims are validated against public keys every time.

### 2. Stripe Subscription Flow

```
User clicks "Subscribe"
    ↓
Server Action creates Stripe Checkout Session
    ↓
User redirected to Stripe Checkout (hosted)
    ↓
Stripe webhook → checkout.session.completed
    ↓
Webhook handler updates Supabase: user.subscription_status = 'active'
    ↓
RLS policies check subscription status for premium features
```

**Key Webhooks to Handle:**
- `checkout.session.completed` - Activate subscription
- `invoice.paid` - Renewal success
- `invoice.payment_failed` - Payment issue
- `customer.subscription.deleted` - Cancellation

### 3. AI Generation Flow (n8n Integration)

```
User submits generation request
    ↓
Server Action validates input (Zod + next-safe-action)
    ↓
Check user's subscription/credits in Supabase
    ↓
POST to n8n webhook with payload
    ↓
n8n workflow processes (async)
    ↓
n8n webhook callback OR polling for status
    ↓
Results stored in Supabase (Airtable in current workflow)
    ↓
TanStack Query invalidates/refetches user's generations
```

### 4. File Upload Pattern (Background Images)

```
Client requests signed upload URL
    ↓
Server Action generates Supabase Storage signed URL (2hr expiry)
    ↓
Client uploads directly to Supabase Storage
    ↓
On success, Server Action records file metadata in database
    ↓
Supabase Storage serves files via CDN
```

### 5. Server Components + TanStack Query Pattern

```tsx
// Server Component (initial load, SEO, no JS)
async function DashboardPage() {
  const supabase = await createServerClient();
  const generations = await supabase.from('generations').select();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GenerationsList initialData={generations} />
    </HydrationBoundary>
  );
}

// Client Component (interactivity, optimistic updates)
'use client';
function GenerationsList({ initialData }) {
  const { data } = useQuery({
    queryKey: ['generations'],
    initialData,
    // TanStack Query handles background refetch, caching
  });

  const mutation = useMutation({
    mutationFn: createGenerationAction, // Server Action
    onSuccess: () => queryClient.invalidateQueries(['generations']),
  });
}
```

---

## Project Structure Recommendation

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/          # Protected route group
│   │   ├── layout.tsx        # Dashboard layout with auth check
│   │   ├── page.tsx          # Dashboard home
│   │   ├── generations/
│   │   └── settings/
│   ├── api/
│   │   └── webhooks/
│   │       └── stripe/route.ts
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── [feature]/            # Feature-specific components
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── middleware.ts     # Auth refresh
│   ├── stripe/
│   │   └── client.ts
│   ├── actions/              # Server Actions
│   │   ├── auth.ts
│   │   ├── generations.ts
│   │   └── subscriptions.ts
│   └── validations/          # Zod schemas
│       └── generation.ts
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript types
└── styles/
    └── globals.css           # Tailwind v4 entry point
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # Server-only, never expose

# Stripe
STRIPE_SECRET_KEY=                 # Server-only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=             # For webhook verification

# n8n
N8N_WEBHOOK_URL=                   # AI generation webhook

# App
NEXT_PUBLIC_APP_URL=               # For redirects, emails
```

---

## Sources

### Official Documentation (HIGH confidence)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Stripe + Next.js Guide](https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=checkout)
- [Tailwind CSS v4 Installation](https://tailwindcss.com/docs/guides/nextjs)
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation/next)
- [TanStack Query SSR Guide](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [next-safe-action Documentation](https://next-safe-action.dev/)
- [nuqs Documentation](https://nuqs.dev/)

### Community & Analysis (MEDIUM confidence)
- [Drizzle vs Prisma Comparison](https://www.bytebase.com/blog/drizzle-vs-prisma/)
- [Vercel Pricing Analysis](https://flexprice.io/blog/vercel-pricing-breakdown)
- [React Server Components + TanStack Query Pattern](https://dev.to/krish_kakadiya_5f0eaf6342/react-server-components-tanstack-query-the-2026-data-fetching-power-duo-you-cant-ignore-21fj)
- [Auth.js to Better Auth Migration](https://dev.to/pipipi-dev/nextauthjs-to-better-auth-why-i-switched-auth-libraries-31h3)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core Framework (Next.js 16, React 19) | HIGH | Official docs verified |
| Authentication (Supabase Auth) | HIGH | Official Supabase docs, established pattern |
| Payments (Stripe) | HIGH | Industry standard, official integration guides |
| UI (Tailwind v4, shadcn/ui) | HIGH | Official docs, widespread adoption |
| Forms (RHF + Zod) | HIGH | Established 2026 pattern, official docs |
| ORM (Drizzle vs Prisma) | MEDIUM | Community consensus favors Drizzle for new projects |
| Hosting (Vercel Pro) | HIGH | Native Next.js optimization |

---

## Open Questions for Phase-Specific Research

1. **Rate Limiting Strategy** - How to implement per-user generation limits with Supabase RLS?
2. **Background Job Processing** - Should n8n remain the job processor, or migrate to Inngest/Trigger.dev?
3. **Caching Strategy** - ISR vs on-demand revalidation for user dashboards?
4. **Multi-tenancy** - Single database with RLS vs schema-per-tenant?

---

*This research informs the roadmap but does not commit to implementation. Phase-specific research may refine these recommendations.*
