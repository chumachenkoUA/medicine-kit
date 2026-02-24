import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"
import { fetchBackend, readResponsePayload } from "@/lib/backend/http"

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/tabletos/[id]">
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ message: "Не вказано ID препарату." }, { status: 400 })
  }
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Некоректний ID препарату." }, { status: 400 })
  }

  try {
    const response = await fetchBackend(`/tabletos/${id}`, { method: "GET" })
    const payload = await readResponsePayload(response)
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      { message: "Не вдалося завантажити деталі препарату." },
      { status: 502 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/tabletos/[id]">
) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { message: "Потрібна авторизація." },
      { status: 401 }
    )
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ message: "Не вказано ID препарату." }, { status: 400 })
  }
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Некоректний ID препарату." }, { status: 400 })
  }

  try {
    const response = await fetchBackend(`/tabletos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const payload = await readResponsePayload(response)
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      { message: "Не вдалося видалити препарат." },
      { status: 502 }
    )
  }
}
