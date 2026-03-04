import {
  badRequestResponse,
  buildPathWithQuery,
  forwardBackendRequest,
  parseNumericId,
  readAccessToken,
  unauthorizedResponse,
} from "@/app/api/_shared/proxy"

interface CourseRouteParams {
  params: Promise<{ id: string }>
}

function toBackendPath(id: string, from?: string, to?: string): string | null {
  const normalized = parseNumericId(id)
  if (!normalized) return null
  return buildPathWithQuery(`/courses/${normalized}/progress`, { from, to })
}

export async function GET(request: Request, { params }: CourseRouteParams) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const { id } = await params
  const url = new URL(request.url)
  const backendPath = toBackendPath(
    id,
    url.searchParams.get("from") ?? undefined,
    url.searchParams.get("to") ?? undefined
  )

  if (!backendPath) {
    return badRequestResponse("Некоректний ID курсу.")
  }

  return forwardBackendRequest({
    path: backendPath,
    method: "GET",
    token,
    networkErrorMessage: "Не вдалося отримати прогрес курсу.",
  })
}
