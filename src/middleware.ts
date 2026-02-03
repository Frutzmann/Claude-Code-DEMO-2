import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
]

const ONBOARDING_ROUTES = ["/onboarding", "/welcome"]

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // Allow public routes
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (isPublicRoute) {
    // Redirect logged-in users away from auth pages (but not callback)
    if (user && pathname !== "/auth/callback") {
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
