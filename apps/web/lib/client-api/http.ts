export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback
  const record = payload as Record<string, unknown>
  const message = record.message

  if (typeof message === "string" && message.trim()) return message
  if (Array.isArray(message)) {
    const first = message.find((item) => typeof item === "string")
    if (typeof first === "string" && first.trim()) return first
  }
  if (typeof record.error === "string" && record.error.trim()) return record.error
  return fallback
}

export async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const json = (await response.json()) as { message?: string; error?: string }
      const message = json.message ?? json.error
      throw new Error(message || `HTTP ${response.status}`)
    }

    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  return (await response.json()) as T
}
