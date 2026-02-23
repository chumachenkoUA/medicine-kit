import { z } from "zod"
import { NextResponse } from "next/server"
import { fetchBackend, getBackendError, readResponsePayload } from "@/lib/backend/http"

const previewBodySchema = z.object({
  url: z.string().url(),
})

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Некоректне тіло запиту." }, { status: 400 })
  }

  const parsed = previewBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Некоректний URL." }, { status: 400 })
  }

  try {
    const response = await fetchBackend("/tabletos/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link: parsed.data.url }),
    })

    if (!response.ok) {
      const message = await getBackendError(
        response,
        "Не вдалося витягнути дані з посилання."
      )
      return NextResponse.json({ message }, { status: response.status })
    }

    const payload = (await readResponsePayload(response)) as {
      link?: string
      name?: string
      description?: string
      photo?: string
    } | null

    return NextResponse.json({
      sourceUrl: payload?.link ?? parsed.data.url,
      name: payload?.name ?? undefined,
      description: payload?.description ?? undefined,
      imageUrl: payload?.photo ?? undefined,
    })
  } catch {
    return NextResponse.json(
      { message: "Не вдалося звернутися до сервісу парсингу." },
      { status: 502 }
    )
  }
}
