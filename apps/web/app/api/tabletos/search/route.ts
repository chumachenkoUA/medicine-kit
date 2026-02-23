import { NextResponse, type NextRequest } from "next/server"
import { fetchBackend, readResponsePayload } from "@/lib/backend/http"

interface BackendTableto {
  Id: number | string
  Name: string
  Format?: string | null
  Description?: string | null
  Link?: string | null
  Photo?: string | null
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? ""
  if (!query) return NextResponse.json([])

  try {
    const response = await fetchBackend("/tabletos", { method: "GET" })
    const payload = (await readResponsePayload(response)) as unknown
    if (!response.ok) {
      return NextResponse.json(
        { message: "Не вдалося виконати пошук препаратів." },
        { status: response.status }
      )
    }

    const list = Array.isArray(payload) ? (payload as BackendTableto[]) : []
    const normalizedQuery = query.toLowerCase()

    const results = list
      .filter((item) => {
        const haystack = [item.Name, item.Format ?? "", item.Description ?? ""]
          .join(" ")
          .toLowerCase()
        return haystack.includes(normalizedQuery)
      })
      .slice(0, 15)
      .map((item) => ({
        id: String(item.Id),
        name: item.Name,
        form: item.Format ?? undefined,
        description: item.Description ?? undefined,
        sourceUrl: item.Link ?? undefined,
        imageUrl: item.Photo ?? undefined,
      }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json(
      { message: "Сервіс пошуку тимчасово недоступний." },
      { status: 502 }
    )
  }
}
