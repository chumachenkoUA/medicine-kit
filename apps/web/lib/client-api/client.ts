import { parseJsonOrThrow } from "@/lib/client-api/http"

function resolveApiPath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path

  if (typeof window !== "undefined") return path

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  const fallbackBaseUrl = "http://localhost:3000"
  return `${baseUrl || fallbackBaseUrl}${path}`
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
  return fetch(resolveApiPath(path), {
    cache: "no-store",
    ...init,
  })
}
