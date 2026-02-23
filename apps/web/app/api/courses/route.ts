import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"
import { fetchBackend, readResponsePayload } from "@/lib/backend/http"

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
