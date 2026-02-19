import { getApiErrorMessage } from "@/lib/client-api/http"
import { API_BASE_URL } from "@/lib/config/api"

function toBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export async function fetchBackend(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(toBackendUrl(path), {
    cache: "no-store",
    ...init,
  })
}

export async function readResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch {
      return { message: "Некоректна JSON-відповідь від бекенду." }
    }
  }

  try {
    const text = await response.text()
    return text ? { message: text } : null
  } catch {
    return null
  }
}

export async function getBackendError(
  response: Response,
  fallback: string
): Promise<string> {
  const payload = await readResponsePayload(response)
  return getApiErrorMessage(payload, fallback)
}
