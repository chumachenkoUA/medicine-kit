import {
  getApiErrorMessage,
  normalizeClientError,
} from "@/lib/client-api/errors"

export { getApiErrorMessage } from "@/lib/client-api/errors"

export async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const json = (await response.json()) as unknown
      const message = getApiErrorMessage(json, `HTTP ${response.status}`)
      throw new Error(message)
    }

    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    throw normalizeClientError(
      error,
      "Сервер повернув некоректний JSON у відповіді."
    )
  }
}
