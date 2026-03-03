import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"
import {
  fetchBackend,
  getBackendError,
  readResponsePayload,
} from "@/lib/backend/http"

interface CourseRouteParams {
  params: Promise<{ id: string }>
}

function toCourseBackendPath(id: string): string | null {
  const normalized = id.trim()
  if (!/^\d+$/.test(normalized)) return null
  return `/courses/${normalized}`
}

export async function PATCH(request: Request, { params }: CourseRouteParams) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { message: "Потрібна авторизація." },
      { status: 401 }
    )
  }

  const { id } = await params
  const backendPath = toCourseBackendPath(id)
  if (!backendPath) {
    return NextResponse.json({ message: "Некоректний ID курсу." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Некоректне тіло запиту." }, { status: 400 })
  }

  try {
    const response = await fetchBackend(backendPath, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const message = await getBackendError(
        response,
        "Не вдалося оновити курс."
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

export async function DELETE(_: Request, { params }: CourseRouteParams) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { message: "Потрібна авторизація." },
      { status: 401 }
    )
  }

  const { id } = await params
  const backendPath = toCourseBackendPath(id)
  if (!backendPath) {
    return NextResponse.json({ message: "Некоректний ID курсу." }, { status: 400 })
  }

  try {
    const response = await fetchBackend(backendPath, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const message = await getBackendError(
        response,
        "Не вдалося видалити курс."
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
