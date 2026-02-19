import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"
import { fetchBackend, readResponsePayload } from "@/lib/backend/http"
import { createTabletoRequestSchema } from "@/lib/medicines/contracts"

export async function GET() {
  try {
    const response = await fetchBackend("/tabletos", { method: "GET" })
    const payload = await readResponsePayload(response)
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      { message: "Не вдалося завантажити список ліків." },
      { status: 502 }
    )
  }
}

export async function POST(request: Request) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { message: "Потрібна авторизація." },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Некоректне тіло запиту." }, { status: 400 })
  }

  const parsed = createTabletoRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Некоректні дані для створення препарату." },
      { status: 400 }
    )
  }

  try {
    const response = await fetchBackend("/tabletos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parsed.data),
    })

    const payload = await readResponsePayload(response)
    return NextResponse.json(payload, { status: response.status })
  } catch {
    return NextResponse.json(
      { message: "Не вдалося створити запис." },
      { status: 502 }
    )
  }
}
