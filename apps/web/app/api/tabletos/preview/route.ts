import { z } from "zod"
import { NextResponse } from "next/server"

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

  // Current backend has no dedicated preview endpoint.
  // Return baseline response so client flow can continue.
  return NextResponse.json({
    sourceUrl: parsed.data.url,
  })
}
