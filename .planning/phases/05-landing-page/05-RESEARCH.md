# Phase 5: Landing Page - Research

**Researched:** 2026-02-03
**Domain:** Next.js 15 App Router Landing Page with shadcn/ui
**Confidence:** HIGH

## Summary

This research investigates best practices for building a SaaS landing page with Next.js 15 App Router, shadcn/ui components, and the established dark theme with glass effects. The landing page must convert visitors to signups with hero, features, pricing, and social proof sections.

The standard approach is to create a pure static page (SSG) at the root route `/`, using existing shadcn/ui components supplemented with section-specific layouts. Animations should use the `motion` library (successor to framer-motion) for React 19 compatibility. The middleware must be updated to allow unauthenticated access to `/` while redirecting authenticated users to the dashboard.

Key finding: Landing pages in 2026 should focus on **outcome-driven storytelling** rather than feature lists. The hero must communicate value within 3-5 seconds, and pricing must be transparent with clear tier differentiation.

**Primary recommendation:** Build a single-page landing at `/` using existing shadcn/ui primitives, add the `motion` package for entrance animations, and structure sections as reusable server components with minimal client-side JavaScript.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.3.1 | App Router, SSG | Already in project |
| shadcn/ui | Latest | UI primitives | Already configured (New York style, Neutral) |
| Tailwind CSS | 4.0.6 | Styling | Already in project |
| lucide-react | 0.474.0 | Icons | Already in project |

### New Addition
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | 12.31.0 | Entrance animations | Official successor to framer-motion, React 19 compatible |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| motion | CSS animations only | CSS is lighter but less expressive for staggered entrances |
| motion | framer-motion | framer-motion has React 19 issues, motion is the official replacement |
| Custom sections | Page UI / Shadcnblocks | Pre-built saves time but harder to match existing glass theme |

**Installation:**
```bash
npm install motion
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx              # Landing page (Server Component)
│   └── layout.tsx            # Root layout (unchanged)
├── components/
│   └── landing/
│       ├── hero.tsx          # Hero section
│       ├── features.tsx      # Features grid
│       ├── pricing.tsx       # Pricing tiers
│       ├── testimonials.tsx  # Social proof
│       ├── cta.tsx           # Final CTA
│       └── navbar.tsx        # Landing navbar (different from dashboard)
```

### Pattern 1: Static Server Component Sections
**What:** Each landing section is a Server Component that renders static HTML
**When to use:** Content that doesn't need interactivity
**Example:**
```typescript
// Source: Next.js App Router best practices
// src/components/landing/features.tsx

import { Sparkles, Zap, Download } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description: "Gemini creates compelling prompts, Kie.ai renders stunning visuals"
  },
  // ...
]

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="glass">
              <CardHeader>
                <feature.icon className="size-10 text-primary mb-4" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### Pattern 2: Client Animation Wrapper
**What:** Wrap sections in a client component for entrance animations
**When to use:** Hero, feature cards, testimonials - any content that should animate on view
**Example:**
```typescript
// Source: motion.dev/docs/react
// src/components/landing/animated-section.tsx
"use client"

import { motion } from "motion/react"
import { ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  delay?: number
}

export function AnimatedSection({ children, delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}
```

### Pattern 3: Pricing Tier Comparison
**What:** Three-column pricing grid with highlighted recommended tier
**When to use:** Pricing section
**Example:**
```typescript
// Based on shadcn pricing patterns
const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with 5 thumbnails/month",
    features: ["5 generations/month", "All AI models", "Download in HD"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    description: "Perfect for active creators",
    features: ["50 generations/month", "Priority generation", "Batch download"],
    cta: "Upgrade to Pro",
    highlighted: true, // Popular choice
  },
  {
    name: "Agency",
    price: "$49",
    description: "For teams and agencies",
    features: ["200 generations/month", "API access (coming)", "Priority support"],
    cta: "Go Agency",
    highlighted: false,
  },
]
```

### Pattern 4: Middleware Update for Public Landing
**What:** Make `/` accessible without authentication while preserving other protected routes
**When to use:** Landing page must be public
**Example:**
```typescript
// src/middleware.ts - Update required
const PUBLIC_ROUTES = [
  "/",           // ADD: Landing page
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/api/webhooks/stripe",
]

// In middleware logic, change "/" handling:
// REMOVE the redirect from "/" to login/dashboard
// Let "/" render the landing page for all users
// ADD: If authenticated and visiting "/", can either show landing or redirect to dashboard
```

### Anti-Patterns to Avoid
- **Giant client components:** Don't make the entire landing page a client component for animations. Use targeted animation wrappers.
- **Feature-first messaging:** Don't lead with "We have X, Y, Z features." Lead with the user's desired outcome.
- **Hidden pricing:** Users abandon pages without visible pricing. Show it clearly.
- **External navigation links:** Don't include blog/careers in landing nav. Keep focus on conversion.
- **Overcomplicated forms:** Don't ask for company size on free signup. Email + password is enough.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Entrance animations | CSS keyframes | motion library | Handles staggered timing, viewport detection, spring physics |
| Pricing toggle (monthly/yearly) | Custom state | Existing shadcn pattern | Edge cases with animation, accessibility |
| Smooth scroll | `scrollIntoView` alone | `scroll-behavior: smooth` + `id` anchors | Browser handles timing, works with prefers-reduced-motion |
| Responsive images | `<img>` tags | Next.js `<Image>` | Automatic optimization, lazy loading, blur placeholders |
| Icon library | SVG files | lucide-react | Already installed, tree-shakeable, consistent sizing |

**Key insight:** This landing page should primarily use what's already in the project. The only new dependency is `motion` for animations.

## Common Pitfalls

### Pitfall 1: Breaking Authentication Flow
**What goes wrong:** Making `/` public breaks the redirect-to-dashboard for authenticated users
**Why it happens:** Middleware logic assumes `/` is either login redirect or dashboard redirect
**How to avoid:** Update middleware to check auth status on `/` - authenticated users can see landing OR be redirected to dashboard (design decision)
**Warning signs:** Authenticated users see landing instead of dashboard, or can't access landing

### Pitfall 2: Performance Bloat from Animations
**What goes wrong:** Large bundle size, slow First Contentful Paint
**Why it happens:** Importing entire motion library, complex animations on first paint
**How to avoid:** Use `motion/react` import path (tree-shakeable), defer non-critical animations with viewport detection
**Warning signs:** Lighthouse performance < 90, LCP > 2.5s

### Pitfall 3: Dark Theme Inconsistency
**What goes wrong:** Landing sections don't match dashboard glass aesthetic
**Why it happens:** Using plain cards instead of glass effect, forgetting oklch colors
**How to avoid:** Use existing `.glass` CSS class, stick to CSS variable colors from globals.css
**Warning signs:** Visual jarring when transitioning between landing and dashboard

### Pitfall 4: Mobile CTA Buried
**What goes wrong:** Primary CTA not visible without scrolling on mobile
**Why it happens:** Desktop-first design, hero too tall
**How to avoid:** Test on 375px viewport, keep hero compact, use sticky CTA on mobile
**Warning signs:** Low mobile conversion rate, high bounce on mobile

### Pitfall 5: Missing SEO Metadata
**What goes wrong:** Poor search indexing, ugly social previews
**Why it happens:** Forgetting to update metadata for landing page
**How to avoid:** Define explicit metadata export in page.tsx with title, description, OpenGraph
**Warning signs:** No preview image when sharing URL, generic "YouTube Thumbnail Factory" in search

### Pitfall 6: Testimonial Placeholder Forever
**What goes wrong:** "Coming soon" or placeholder testimonials never get replaced
**Why it happens:** No real users yet, deferred indefinitely
**How to avoid:** Either use hypothetical scenarios with disclaimers, or skip section initially
**Warning signs:** Fake names/companies visible to users, credibility loss

## Code Examples

Verified patterns from official sources:

### SEO Metadata for Landing Page
```typescript
// Source: nextjs.org/docs/app/api-reference/functions/generate-metadata
// src/app/page.tsx

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "YouTube Thumbnail Factory - AI-Powered Thumbnails in Seconds",
  description: "Generate professional YouTube thumbnails without design skills. Upload your portrait, add backgrounds, and let AI create scroll-stopping thumbnails.",
  openGraph: {
    title: "YouTube Thumbnail Factory",
    description: "AI-powered thumbnails in seconds",
    url: "https://yourthumbnailfactory.com",
    siteName: "YouTube Thumbnail Factory",
    images: [
      {
        url: "/og-image.png", // Create this!
        width: 1200,
        height: 630,
        alt: "YouTube Thumbnail Factory Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Thumbnail Factory",
    description: "AI-powered thumbnails in seconds",
    images: ["/og-image.png"],
  },
}
```

### Hero Section with Animation
```typescript
// Source: motion.dev + shadcn patterns
// src/components/landing/hero.tsx
"use client"

import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center py-20">
      <div className="container mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-bold mb-6"
        >
          Scroll-Stopping Thumbnails
          <br />
          <span className="text-muted-foreground">In Seconds, Not Hours</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
        >
          Upload your portrait, add backgrounds, enter keywords.
          Our AI creates professional thumbnails while you focus on content.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Free <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#pricing">View Pricing</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
```

### Pricing Card with Highlight
```typescript
// Source: shadcn pricing patterns
// src/components/landing/pricing.tsx

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface PricingTierProps {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  ctaHref: string
  highlighted?: boolean
}

export function PricingTier({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  highlighted = false,
}: PricingTierProps) {
  return (
    <Card className={cn(
      "glass relative",
      highlighted && "border-primary ring-2 ring-primary/20"
    )}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">/{period}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="size-4 text-primary" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={highlighted ? "default" : "outline"}
          asChild
        >
          <Link href={ctaHref}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### Smooth Scroll Navigation
```typescript
// src/components/landing/navbar.tsx
"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" },
]

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          Thumbnail Factory
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| framer-motion | motion | 2024 | React 19 compatibility, same API |
| Feature-first hero | Outcome-driven hero | 2025-2026 | Better conversion rates |
| Separate pricing page | Inline pricing section | 2024-2025 | Reduces friction |
| Static testimonials | Animated carousels | 2025 | Higher engagement |
| Navigation-heavy landing | Minimal nav, anchor links | 2025-2026 | Keeps focus on conversion |

**Deprecated/outdated:**
- `framer-motion` package: Use `motion` instead for React 19
- Feature bullet lists in hero: Use outcome statements instead
- Hidden pricing: Transparency is expected in 2026

## Open Questions

Things that couldn't be fully resolved:

1. **Authenticated user landing page behavior**
   - What we know: Middleware needs update to allow `/` as public
   - What's unclear: Should authenticated users see landing or redirect to dashboard?
   - Recommendation: Show landing page to ALL users (logged in or not), with "Go to Dashboard" CTA for authenticated users instead of "Sign Up"

2. **Testimonials content**
   - What we know: Social proof section is required (LAND-04)
   - What's unclear: No real user testimonials exist yet
   - Recommendation: Use placeholder with "What our users say" + coming soon, OR use hypothetical scenarios clearly labeled as examples

3. **OG Image creation**
   - What we know: OpenGraph image needed for social previews
   - What's unclear: Design specs, who creates it
   - Recommendation: Can be deferred; use text-only OG initially, add image later

## Sources

### Primary (HIGH confidence)
- Next.js Official Docs - generateMetadata, App Router patterns
- motion.dev - Animation library installation and usage
- Existing project codebase - shadcn/ui components, globals.css theme

### Secondary (MEDIUM confidence)
- [Zignuts - Next.js Landing Page Layouts](https://www.zignuts.com/blog/nextjs-landing-page-layouts) - Conversion patterns
- [Shadcnblocks](https://www.shadcnblocks.com/) - Component patterns
- [Fibr.ai - SaaS Landing Pages](https://fibr.ai/landing-page/saas-landing-pages) - 2026 best practices
- [Moosend - Landing Page Mistakes](https://moosend.com/blog/landing-page-mistakes/) - Pitfall identification

### Tertiary (LOW confidence)
- Various landing page template repositories - Patterns only, not implementation details

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies + one verified addition (motion)
- Architecture: HIGH - Standard Next.js App Router patterns
- Pitfalls: MEDIUM - Based on community patterns and common sense
- Code examples: HIGH - Verified against official docs

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable patterns)
