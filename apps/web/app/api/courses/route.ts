import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"
import {
  fetchBackend,
  getBackendError,
  readResponsePayload,
} from "@/lib/backend/http"
import { createCourseRequestSchema } from "@/lib/medicines/contracts"

export async function GET() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { message: "Потрібна авторизація." },
      { status: 401 }
    )
  }

  try {
    const response = await fetchBackend("/courses", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const payload = await readResponsePayload(response)
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      { message: "Не вдалося завантажити курси." },
      { status: 502 }
    )
  }
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

export async function POST(request: Request) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { message: "Потрібна авторизація." },
      { status: 401 }
    )
  }

  const userId = readUserIdFromPayload(parseJwtPayload(token))
  if (!userId) {
    return NextResponse.json(
      { message: "Не вдалося визначити користувача поточної сесії." },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Некоректне тіло запиту." }, { status: 400 })
  }

  const parsed = createCourseRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Некоректні дані для створення курсу." },
      { status: 400 }
    )
  }

  try {
    const response = await fetchBackend("/courses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...parsed.data,
        userId,
        description: parsed.data.description?.trim() || undefined,
      }),
    })

    if (!response.ok) {
      const message = await getBackendError(
        response,
        "Не вдалося створити курс."
      )
      return NextResponse.json({ message }, { status: response.status })
    }

    const payload = await readResponsePayload(response)
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      { message: "Не вдалося звернутися до сервісу курсів." },
      { status: 502 }
    )
  }
}
