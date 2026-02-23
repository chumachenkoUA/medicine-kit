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

export function normalizeClientError(error: unknown, fallback: string): Error {
  if (error instanceof Error && error.message.trim()) return error
  if (typeof error === "string" && error.trim()) return new Error(error)
  return new Error(fallback)
}

export function logClientError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const normalized = normalizeClientError(error, "Невідома клієнтська помилка.")
  if (context && Object.keys(context).length > 0) {
    console.error(`[${scope}] ${normalized.message}`, { error, ...context })
    return
  }

  console.error(`[${scope}] ${normalized.message}`, error)
}
