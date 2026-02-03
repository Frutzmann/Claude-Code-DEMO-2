import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
]

// Will be used in Plan 04
// const ONBOARDING_ROUTES = ["/onboarding", "/welcome"]

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
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

  // Onboarding check will be added in Plan 04

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
