import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = req.cookies.get("session")?.value
  if (!session && !pathname.startsWith("/login")) return NextResponse.redirect(new URL("/login", req.url))
  if (session && pathname.startsWith("/login")) return NextResponse.redirect(new URL("/dashboard", req.url))
  return NextResponse.next()
}
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\..*).*)"] }
