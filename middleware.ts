import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Log all cookies for debugging in Vercel
  console.error("Middleware hit for path:", pathname)
  console.error("All cookies:", req.cookies)
  const jsessionId = req.cookies.get("JSESSIONID")?.value
  console.error("JSESSIONID:", jsessionId)

  // Always allow login page
  if (pathname === "/login") {
    return NextResponse.next()
  }

  // Allow _next static assets and favicon
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // If no JSESSIONID, redirect to login
  if (!jsessionId) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Otherwise, allow request
  return NextResponse.next()
}

// Matcher: all routes except login, static assets, and API routes if needed
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api).*)"
  ],
}
