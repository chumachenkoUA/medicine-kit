import { NextResponse, type NextRequest } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"

const AUTH_PATHS = new Set(["/login", "/register"])
const PROTECTED_PREFIXES = ["/dashboard", "/schedule", "/profile", "/medicines"]

function parseJwtExp(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1]
    if (!payloadPart) return null

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    const payloadRaw = atob(padded)
    const payload = JSON.parse(payloadRaw) as { exp?: unknown }
    const exp = Number(payload.exp)

    return Number.isFinite(exp) ? exp : null
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const expSeconds = parseJwtExp(token)
  if (expSeconds == null) return true

  const nowSeconds = Math.floor(Date.now() / 1000)
  return expSeconds <= nowSeconds
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function withDeletedAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  })
  return response
}

function handleProxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const hasValidToken = Boolean(token) && !isTokenExpired(token)

  if (AUTH_PATHS.has(pathname)) {
    if (hasValidToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    if (token) {
      return withDeletedAuthCookie(NextResponse.next())
    }

    return NextResponse.next()
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (hasValidToken) {
    return NextResponse.next()
  }

  return withDeletedAuthCookie(NextResponse.redirect(new URL("/login", request.url)))
}

export { handleProxy as proxy }
export default handleProxy

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
