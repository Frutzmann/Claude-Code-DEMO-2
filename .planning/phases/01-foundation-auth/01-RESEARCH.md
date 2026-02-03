# Phase 1: Foundation & Auth - Research

**Researched:** 2026-02-03
**Domain:** Supabase Auth + Next.js 15 App Router + Onboarding Flow + Dark Theme UI
**Confidence:** HIGH

## Summary

This research covers the foundational setup for a Next.js 15 application with Supabase authentication, user onboarding with portrait upload, and a modern dark theme UI. The phase implements requirements AUTH-01 through AUTH-05, ONBD-01 through ONBD-03, ADMN-01, and UIUX-01 through UIUX-05.

The standard approach uses `@supabase/ssr` (not the deprecated `@supabase/auth-helpers`) for SSR-compatible cookie-based authentication, Next.js middleware for session refresh and route protection, a profiles table with automatic creation via database trigger, and shadcn/ui with next-themes for dark mode. The onboarding flow uses a `profiles.onboarding_completed` flag checked in middleware to force new users through portrait upload before accessing the main app.

Key insight: Supabase Auth requires THREE client types (browser, server, middleware) and a specific middleware setup to handle token refresh - this is non-negotiable for SSR auth to work correctly.

**Primary recommendation:** Use `@supabase/ssr` with cookie-based auth, profiles table with database trigger for auto-creation, middleware-based onboarding enforcement, and shadcn/ui with next-themes for consistent dark theme.

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.x | Supabase client SDK | Official SDK, required for all Supabase operations |
| `@supabase/ssr` | ^0.6+ | SSR auth helper | Replaces deprecated auth-helpers, handles cookie-based sessions for Next.js |
| `next-themes` | ^0.4+ | Theme management | Standard for shadcn/ui, handles dark mode with SSR hydration |
| `react-hook-form` | ^7.60+ | Form state management | Minimal re-renders, uncontrolled components, works with Server Actions |
| `zod` | ^3.25+ | Schema validation | TypeScript-first, same schema client/server, standard schema compatible |
| `@hookform/resolvers` | ^5.x | RHF + Zod bridge | Official resolver package for Zod integration |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sonner` | ^2.x | Toast notifications | Success/error feedback after form submissions |
| `lucide-react` | ^0.560+ | Icons | All icons including loading spinner (Loader2) |

### Already in Stack (from STACK.md)

These are pre-selected in project stack research and used in this phase:

| Library | Purpose |
|---------|---------|
| Next.js 16 | App Router, Server Components, Server Actions |
| Tailwind CSS v4 | CSS-first config, dark mode via CSS variables |
| shadcn/ui | Accessible UI components (Button, Input, Card, Form) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/ssr` | NextAuth.js/Auth.js | NextAuth team joined Better Auth (Sept 2025), Supabase Auth integrates better with Supabase ecosystem |
| Profiles table | User metadata only | User metadata has size limits and less queryable; profiles table enables RLS and complex queries |
| Middleware onboarding check | Client-side redirect | Middleware prevents flash of protected content, more secure |

**Installation:**

```bash
npm install @supabase/supabase-js @supabase/ssr next-themes react-hook-form zod @hookform/resolvers sonner lucide-react
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth route group (no sidebar)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── layout.tsx
│   ├── (onboarding)/              # Onboarding route group
│   │   ├── onboarding/page.tsx    # Portrait upload step
│   │   ├── welcome/page.tsx       # Tutorial/welcome step
│   │   └── layout.tsx
│   ├── (dashboard)/               # Protected route group
│   │   └── layout.tsx             # Auth check, sidebar
│   ├── auth/
│   │   └── callback/route.ts      # OAuth & email link handler
│   ├── layout.tsx                 # Root: ThemeProvider, Toaster
│   └── globals.css                # Tailwind v4, dark theme vars
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── auth/                      # Auth-specific components
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   ├── forgot-password-form.tsx
│   │   └── reset-password-form.tsx
│   ├── onboarding/
│   │   └── portrait-upload.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client (createBrowserClient)
│   │   ├── server.ts              # Server client (createServerClient)
│   │   └── middleware.ts          # updateSession helper
│   └── validations/
│       ├── auth.ts                # Zod schemas for auth forms
│       └── onboarding.ts          # Zod schemas for portrait upload
├── actions/
│   └── auth.ts                    # Server Actions for auth
└── middleware.ts                  # Route protection + session refresh
```

### Pattern 1: Supabase Client Architecture (THREE clients required)

**What:** Separate Supabase clients for browser, server, and middleware contexts.
**When to use:** Always - this is the only correct pattern for SSR auth.

**Browser Client (`lib/supabase/client.ts`):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**Server Client (`lib/supabase/server.ts`):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}
```

**Middleware Helper (`lib/supabase/middleware.ts`):**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not use getSession() - it doesn't validate tokens
  // Always use getClaims() which validates against Supabase's public keys
  const { data: { user } } = await supabase.auth.getUser()

  return { supabaseResponse, user, supabase }
}
```

### Pattern 2: Middleware Route Protection with Onboarding Enforcement

**What:** Middleware that protects routes AND redirects incomplete profiles to onboarding.
**When to use:** Every protected route needs this check.

```typescript
// middleware.ts
// Source: https://makerkit.dev/docs/next-supabase-turbo/recipes/onboarding-checkout
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']
const ONBOARDING_ROUTES = ['/onboarding', '/welcome']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Redirect logged-in users away from auth pages
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Require auth for everything else
  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check onboarding status for non-onboarding routes
  if (!ONBOARDING_ROUTES.some(route => pathname.startsWith(route))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Redirect completed users away from onboarding
  if (ONBOARDING_ROUTES.some(route => pathname.startsWith(route))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: Profiles Table with Auto-Creation Trigger

**What:** Database trigger that creates profile row when user signs up.
**When to use:** On initial Supabase setup.

```sql
-- Source: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
-- Run in Supabase SQL Editor

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Pattern 4: Dark Theme with shadcn/ui and next-themes

**What:** CSS-first dark theme with system preference support.
**When to use:** Root layout setup.

**Theme Provider (`components/theme-provider.tsx`):**
```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/next
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**Root Layout:**
```typescript
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Dark Theme CSS Variables (`globals.css`):**
```css
/* Source: https://ui.shadcn.com/docs/theming */
@import "tailwindcss";

@theme {
  /* Dark theme is default - glass effect colors */
  --color-background: oklch(0.13 0.02 270);
  --color-foreground: oklch(0.98 0.01 270);
  --color-card: oklch(0.15 0.02 270 / 0.8);
  --color-card-foreground: oklch(0.98 0.01 270);
  --color-primary: oklch(0.65 0.2 250);
  --color-primary-foreground: oklch(0.98 0.01 270);
  --color-muted: oklch(0.25 0.02 270);
  --color-muted-foreground: oklch(0.65 0.02 270);
  --color-border: oklch(0.3 0.02 270 / 0.5);
  --color-input: oklch(0.2 0.02 270);
  --color-ring: oklch(0.65 0.2 250);
  --color-destructive: oklch(0.55 0.25 25);
  --radius: 0.75rem;
}

/* Glass effect utility */
.glass {
  background: oklch(0.15 0.02 270 / 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid oklch(0.3 0.02 270 / 0.3);
}
```

### Pattern 5: Form with Loading State and Validation Errors

**What:** React Hook Form + Zod + shadcn/ui Form components with loading feedback.
**When to use:** All auth forms (login, signup, forgot password, reset password).

```typescript
// Source: https://ui.shadcn.com/docs/forms/react-hook-form
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: LoginValues) {
    setIsLoading(true)
    try {
      // Call server action or API
      await signIn(data)
      toast.success("Welcome back!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          {...form.register("email")}
          id="email"
          type="email"
          placeholder="you@example.com"
          disabled={isLoading}
          aria-invalid={!!form.formState.errors.email}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          {...form.register("password")}
          id="password"
          type="password"
          disabled={isLoading}
          aria-invalid={!!form.formState.errors.password}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  )
}
```

### Anti-Patterns to Avoid

- **Using `getSession()` in server code:** Always use `getUser()` or `getClaims()` which validates JWT signatures
- **Single Supabase client:** You MUST have browser, server, and middleware clients
- **Checking onboarding in layout:** Use middleware - layouts can't redirect properly and cause flash
- **Storing auth state in React state:** Let Supabase cookies be the source of truth
- **Not calling `updateSession` in middleware:** Tokens will expire and auth will fail randomly

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt implementation | Supabase Auth | Security critical, rate limiting, token management |
| Email verification | Custom email + token system | Supabase Auth magic links | Email delivery, token expiry, confirmation flows |
| Password reset | Custom reset flow | `supabase.auth.resetPasswordForEmail()` | Secure token generation, expiry handling |
| Session refresh | Manual JWT refresh logic | `@supabase/ssr` middleware | Cookie handling, race conditions |
| Theme switching | Custom localStorage + context | `next-themes` | SSR hydration, system preference sync |
| Form validation | Manual if/else checks | Zod + React Hook Form | Type inference, reusable schemas |
| Toast notifications | Custom notification system | Sonner | Animations, promise support, accessibility |

**Key insight:** Auth is security-critical. Every custom implementation is a potential vulnerability. Use Supabase's battle-tested auth system for all authentication flows.

## Common Pitfalls

### Pitfall 1: Session Management Across Client/Server Boundary

**What goes wrong:** Inconsistent authentication states between client and server components. Users appear logged in on one side but not the other.

**Why it happens:** Manual token management instead of using `@supabase/ssr`. The auth-helpers package is deprecated.

**How to avoid:**
1. Use `@supabase/ssr` exclusively
2. Create separate clients for browser, server, and middleware
3. Always call `updateSession` in middleware
4. Never use `getSession()` in server code - use `getUser()` or `getClaims()`

**Warning signs:** Hydration errors, random logouts, auth works in dev but not production.

### Pitfall 2: RLS Disabled = Database Exposed

**What goes wrong:** All data publicly accessible via Supabase REST API. Anyone with your anon key can read/write everything.

**Why it happens:** RLS disabled by default on new tables.

**How to avoid:**
1. Enable RLS immediately after creating ANY table
2. Create at least one policy before inserting data
3. Run Supabase Security Advisor before deployment

**Warning signs:** Queries returning data for other users, Supabase dashboard warnings.

### Pitfall 3: Onboarding Check in Layout Instead of Middleware

**What goes wrong:** Flash of dashboard content before redirect to onboarding. Poor UX and potential data exposure.

**Why it happens:** Layouts run after the page starts rendering, can't cleanly redirect.

**How to avoid:**
1. Check onboarding_completed in middleware
2. Redirect before any protected content renders
3. Cache the profile query result in middleware response

**Warning signs:** Brief flash of protected content, console errors about navigation.

### Pitfall 4: Storage RLS Blocking Legitimate Uploads

**What goes wrong:** File uploads fail with 403 "new row violates row-level security policy" even for authenticated users.

**Why it happens:** Supabase Storage uses RLS on `storage.objects`. No policies = no uploads.

**How to avoid:**
```sql
-- Allow authenticated users to upload to their folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portraits' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'portraits' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Warning signs:** 403 errors on upload, works with service role key but not user token.

### Pitfall 5: Email Verification Rate Limits

**What goes wrong:** Users can't resend verification email. "Email rate limit exceeded" errors.

**Why it happens:** Supabase default: 2 emails/hour per address.

**How to avoid:**
1. Configure custom SMTP in production (Resend, Sendgrid)
2. Show clear UI when rate limited
3. Don't let users spam "resend" button

**Warning signs:** Users complaining they never received email, rate limit errors in logs.

## Code Examples

### Auth Callback Handler (for email links and OAuth)

```typescript
// app/auth/callback/route.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // For password reset, redirect to reset-password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
```

### Signup with Email Verification

```typescript
// actions/auth.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect to check-email page
  redirect('/login?message=Check your email to confirm your account')
}
```

### Password Reset Flow

```typescript
// actions/auth.ts
"use server"

export async function forgotPassword(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function resetPassword(password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  redirect('/login?message=Password updated successfully')
}
```

### Portrait Upload with Storage

```typescript
// components/onboarding/portrait-upload.tsx
"use client"

import { createClient } from '@/lib/supabase/client'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export function PortraitUpload({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('portraits')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('portraits')
        .getPublicUrl(fileName)

      // Update profile with portrait URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          onboarding_completed: true,
        })
        .eq('id', userId)

      if (updateError) throw updateError

      toast.success('Portrait uploaded successfully!')
      // Redirect will happen via middleware on next navigation
      window.location.href = '/dashboard'

    } catch (error) {
      toast.error('Failed to upload portrait')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }, [userId, supabase])

  return (
    // ... drag and drop UI
  )
}
```

### Admin Check Pattern

```typescript
// lib/admin.ts
export function isAdmin(email: string | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  return !!adminEmail && email === adminEmail
}

// In Server Component or Server Action
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export async function checkIsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return isAdmin(user?.email)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers` | `@supabase/ssr` | 2024 | auth-helpers deprecated, ssr handles all SSR patterns |
| `getSession()` server-side | `getUser()` or `getClaims()` | 2024 | getSession doesn't validate tokens, security risk |
| Tailwind config.js | CSS-first `@theme` | Tailwind v4 (2025) | No config file needed, use CSS variables |
| `useRouter()` for auth redirects | Middleware redirects | Next.js 13+ | Prevents flash of protected content |
| Context-based auth state | Cookie-based via SSR | 2024 | Server Components can access auth directly |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Use `@supabase/ssr` instead
- `supabase.auth.getSession()` in server code: Use `getUser()` for validated sessions
- `tailwind.config.js`: Use CSS-first configuration in globals.css with `@theme`

## Open Questions

Things that couldn't be fully resolved:

1. **Exact admin identification implementation**
   - What we know: Admin identified by `ADMIN_EMAIL` env var
   - What's unclear: Should admin status be stored in profiles table or checked dynamically?
   - Recommendation: Check dynamically via env var for flexibility; cache in middleware response for performance

2. **Portrait storage bucket configuration**
   - What we know: Need public bucket for portrait URLs to work in n8n workflow
   - What's unclear: Should portraits be public or use signed URLs?
   - Recommendation: Use public bucket with user-folder structure for RLS; portraits aren't sensitive

## Sources

### Primary (HIGH confidence)
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Client setup, middleware pattern
- [Supabase SSR Client Creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client) - Browser/server/middleware clients
- [Supabase Password Auth](https://supabase.com/docs/guides/auth/passwords) - Signup, verification, reset
- [shadcn/ui Dark Mode](https://ui.shadcn.com/docs/dark-mode/next) - next-themes setup
- [shadcn/ui Form](https://ui.shadcn.com/docs/forms/react-hook-form) - RHF + Zod integration
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - Storage RLS patterns

### Secondary (MEDIUM confidence)
- [MakerKit Onboarding Flow](https://makerkit.dev/docs/next-supabase-turbo/recipes/onboarding-checkout) - Onboarding middleware pattern
- [Supabase Profiles Trigger](https://dev.to/dailydevtips1/supabase-automatically-create-user-profiles-on-sign-up-3fbg) - Auto-create profile pattern
- [glasscn-ui](https://github.com/itsjavi/glasscn-ui) - Glass effect variants for shadcn/ui
- [Tailwind CSS v4 Responsive Design](https://tailwindcss.com/docs/responsive-design) - Breakpoint patterns

### Tertiary (LOW confidence)
- General web search results for 2026 ecosystem patterns - marked for validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase docs and shadcn/ui docs verified
- Architecture: HIGH - Patterns from official Next.js and Supabase documentation
- Pitfalls: HIGH - From existing project PITFALLS.md research with official source verification

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable libraries, established patterns)
