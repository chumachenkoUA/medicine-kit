import {
  badRequestResponse,
  buildPathWithQuery,
  forwardBackendRequest,
  parseJsonBody,
  readAccessToken,
  unauthorizedResponse,
} from "@/app/api/_shared/proxy"
import { NextResponse } from "next/server"
import { createTabletosUserRequestSchema } from "@/lib/medicines/contracts"

export async function GET(request: Request) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const requestUrl = new URL(request.url)
  const backendPath = buildPathWithQuery("/tabletos-users", {
    search: requestUrl.searchParams.get("search") ?? undefined,
    effect: requestUrl.searchParams.get("effect") ?? undefined,
    sort: requestUrl.searchParams.get("sort") ?? undefined,
    showExpired: requestUrl.searchParams.get("showExpired") ?? undefined,
  })

  return forwardBackendRequest({
    path: backendPath,
    method: "GET",
    token,
    networkErrorMessage: "Не вдалося завантажити дані аптечки користувача.",
  })
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Payload = token.split(".")[1]
    if (!base64Payload) return null
    const json = Buffer.from(base64Payload, "base64url").toString("utf8")
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function readUserIdFromPayload(payload: Record<string, unknown> | null): number | null {
  const rawSub = payload?.sub
  if (typeof rawSub === "number" && Number.isInteger(rawSub) && rawSub > 0) {
    return rawSub
  }

  if (typeof rawSub === "string") {
    const parsed = Number(rawSub)
    if (Number.isInteger(parsed) && parsed > 0) return parsed
  }

  return null
}

function toIsoDateTimeFromDateInput(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}

export async function POST(request: Request) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const userId = readUserIdFromPayload(parseJwtPayload(token))
  if (!userId) {
    return NextResponse.json(
      { message: "Не вдалося визначити користувача поточної сесії." },
      { status: 401 }
    )
  }

  const parsedBody = await parseJsonBody(request)
  if (!parsedBody.ok) return parsedBody.response

  const parsed = createTabletosUserRequestSchema.safeParse(parsedBody.data)
  if (!parsed.success) {
    return badRequestResponse("Некоректні дані для створення упаковки.")
  }

  return forwardBackendRequest({
    path: "/tabletos-users",
    method: "POST",
    token,
    body: {
      ...parsed.data,
      expirationDate: toIsoDateTimeFromDateInput(parsed.data.expirationDate),
      userId,
    },
    backendErrorMessage: "Не вдалося створити упаковку препарату.",
    networkErrorMessage: "Не вдалося звернутися до сервісу упаковок.",
  })
}
