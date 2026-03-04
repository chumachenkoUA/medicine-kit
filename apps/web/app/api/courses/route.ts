import {
  badRequestResponse,
  forwardBackendRequest,
  parseJsonBody,
  readAccessToken,
  unauthorizedResponse,
} from "@/app/api/_shared/proxy"
import { createCourseRequestSchema } from "@/lib/medicines/contracts"

export async function GET() {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  return forwardBackendRequest({
    path: "/courses",
    method: "GET",
    token,
    networkErrorMessage: "Не вдалося завантажити курси.",
  })
}

export async function POST(request: Request) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const parsedBody = await parseJsonBody(request)
  if (!parsedBody.ok) return parsedBody.response

  const parsed = createCourseRequestSchema.safeParse(parsedBody.data)
  if (!parsed.success) {
    return badRequestResponse("Некоректні дані для створення курсу.")
  }

  return forwardBackendRequest({
    path: "/courses",
    method: "POST",
    token,
    body: {
      ...parsed.data,
      description: parsed.data.description?.trim() || undefined,
    },
    backendErrorMessage: "Не вдалося створити курс.",
    networkErrorMessage: "Не вдалося звернутися до сервісу курсів.",
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
