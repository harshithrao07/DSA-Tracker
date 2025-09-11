import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const jsessionId = req.cookies.get("JSESSIONID")?.value

  // Always allow the login page
  if (req.nextUrl.pathname === "/login") {
    return NextResponse.next()
  }

  // If no JSESSIONID -> redirect to login
  if (!jsessionId) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login).*)"],
}
