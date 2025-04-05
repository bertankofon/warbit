import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Refresh session if expired
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error in middleware:", error)
    }

    // If no session and trying to access protected routes, redirect to login
    const path = req.nextUrl.pathname
    const isProtectedRoute =
      path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/token-status")

    if (!session && isProtectedRoute) {
      const redirectUrl = new URL("/login", req.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If session exists and user is on login/signup, redirect to dashboard
    const isAuthRoute = path === "/login" || path === "/signup"
    if (session && isAuthRoute) {
      const redirectUrl = new URL("/dashboard", req.url)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (err) {
    console.error("Middleware error:", err)
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}

