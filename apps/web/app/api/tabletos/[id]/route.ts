import { NextResponse, type NextRequest } from "next/server"
import { fetchBackend, readResponsePayload } from "@/lib/backend/http"

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/tabletos/[id]">
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ message: "Не вказано ID препарату." }, { status: 400 })
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
