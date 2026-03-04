import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"
import {
  fetchBackend,
  getBackendError,
  readResponsePayload,
} from "@/lib/backend/http"

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"

interface ForwardBackendRequestOptions {
  path: string
  method: HttpMethod
  token?: string
  body?: unknown
  backendErrorMessage?: string
  networkErrorMessage: string
}

type ParsedBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse }

export async function readAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { message: "Потрібна авторизація." },
    { status: 401 }
  )
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ message }, { status: 400 })
}

export function gatewayErrorResponse(message: string) {
  return NextResponse.json({ message }, { status: 502 })
}

export function parseNumericId(value: string): string | null {
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) return null
  return normalized
}

export async function parseJsonBody(request: Request): Promise<ParsedBodyResult> {
  try {
    return { ok: true, data: await request.json() }
  } catch {
    return {
      ok: false,
      response: badRequestResponse("Некоректне тіло запиту."),
    }
  }
}

export function buildPathWithQuery(
  basePath: string,
  params: Record<string, string | undefined>
): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const normalized = value?.trim()
    if (normalized) query.set(key, normalized)
  }

  const queryString = query.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

export async function forwardBackendRequest({
  path,
  method,
  token,
  body,
  backendErrorMessage,
  networkErrorMessage,
}: ForwardBackendRequestOptions): Promise<NextResponse> {
  try {
    const response = await fetchBackend(path, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })

    if (!response.ok && backendErrorMessage) {
      const message = await getBackendError(response, backendErrorMessage)
      return NextResponse.json({ message }, { status: response.status })
    }

    const payload = await readResponsePayload(response)
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return gatewayErrorResponse(networkErrorMessage)
  }
}
