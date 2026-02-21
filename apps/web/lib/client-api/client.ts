import { parseJsonOrThrow } from "@/lib/client-api/http"

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`
}

function resolveApiPath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path

  const normalizedPath = normalizePath(path)
  if (typeof window !== "undefined") return normalizedPath

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "")

  if (appBaseUrl) return `${appBaseUrl}${normalizedPath}`

  const port = process.env.PORT || "3000"
  return `http://localhost:${port}${normalizedPath}`
}

async function withServerCookies(init?: RequestInit): Promise<RequestInit> {
  if (typeof window !== "undefined") return init ?? {}

  try {
    const { cookies } = await import("next/headers")
    const cookieHeader = (await cookies()).toString()
    if (!cookieHeader) return init ?? {}

    const headers = new Headers(init?.headers)
    if (!headers.has("cookie")) {
      headers.set("cookie", cookieHeader)
    }

    return { ...init, headers }
  } catch {
    return init ?? {}
  }
}

export async function fetchApiJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetchApiResponse(path, init)
  return parseJsonOrThrow<T>(response)
}

export async function fetchApiResponse(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const initWithCookies = await withServerCookies(init)
  return fetch(resolveApiPath(path), {
    cache: "no-store",
    ...initWithCookies,
  })
}
