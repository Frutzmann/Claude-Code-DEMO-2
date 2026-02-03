import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/api/webhooks/stripe",
]

const ONBOARDING_ROUTES = ["/onboarding", "/welcome"]

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // Allow public routes
  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    // Exact match for root path to avoid matching everything
    if (route === "/") return pathname === "/"
    return pathname.startsWith(route)
  })

  if (isPublicRoute) {
    // Let "/" (landing page) render for all users - no redirect
    if (pathname === "/") {
      return supabaseResponse
    }
    // Redirect logged-in users away from auth pages (but not callback or reset-password)
    // Note: reset-password needs the user to be "logged in" via Supabase's magic link
    if (user && pathname !== "/auth/callback" && !pathname.startsWith("/reset-password")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return supabaseResponse
  }

  // Require auth for protected routes
  if (!user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if current route is an onboarding route
  const isOnboardingRoute = ONBOARDING_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // Fetch onboarding status
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single()

  // If profile doesn't exist or query failed, allow access (let page handle error)
  if (profile !== null) {
    // Redirect incomplete users to onboarding (if not already on onboarding pages)
    if (!isOnboardingRoute && !profile.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    // Redirect completed users away from onboarding pages
    if (isOnboardingRoute && profile.onboarding_completed) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
