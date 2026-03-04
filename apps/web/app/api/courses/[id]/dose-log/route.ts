import {
  badRequestResponse,
  forwardBackendRequest,
  parseJsonBody,
  parseNumericId,
  readAccessToken,
  unauthorizedResponse,
} from "@/app/api/_shared/proxy"

interface CourseRouteParams {
  params: Promise<{ id: string }>
}

function toBackendPath(id: string): string | null {
  const normalized = parseNumericId(id)
  if (!normalized) return null
  return `/courses/${normalized}/dose-log`
}

export async function POST(request: Request, { params }: CourseRouteParams) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const { id } = await params
  const backendPath = toBackendPath(id)
  if (!backendPath) {
    return badRequestResponse("Некоректний ID курсу.")
  }

  const parsedBody = await parseJsonBody(request)
  if (!parsedBody.ok) return parsedBody.response

  return forwardBackendRequest({
    path: backendPath,
    method: "POST",
    token,
    body: parsedBody.data,
    backendErrorMessage: "Не вдалося оновити статус дози.",
    networkErrorMessage: "Не вдалося звернутися до сервісу курсів.",
  })
}
