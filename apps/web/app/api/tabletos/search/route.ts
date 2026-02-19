import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? ""
  if (!query) return NextResponse.json([])

  // Current backend has no dedicated search endpoint.
  // Keep this route to preserve stable client API.
  return NextResponse.json([])
}
