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

function toCourseBackendPath(id: string): string | null {
  const normalized = parseNumericId(id)
  if (!normalized) return null
  return `/courses/${normalized}`
}

export async function PATCH(request: Request, { params }: CourseRouteParams) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const { id } = await params
  const backendPath = toCourseBackendPath(id)
  if (!backendPath) {
    return badRequestResponse("Некоректний ID курсу.")
  }

  const parsedBody = await parseJsonBody(request)
  if (!parsedBody.ok) return parsedBody.response

  return forwardBackendRequest({
    path: backendPath,
    method: "PATCH",
    token,
    body: parsedBody.data,
    backendErrorMessage: "Не вдалося оновити курс.",
    networkErrorMessage: "Не вдалося звернутися до сервісу курсів.",
  })
}

export async function DELETE(_: Request, { params }: CourseRouteParams) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const { id } = await params
  const backendPath = toCourseBackendPath(id)
  if (!backendPath) {
    return badRequestResponse("Некоректний ID курсу.")
  }

  return forwardBackendRequest({
    path: backendPath,
    method: "DELETE",
    token,
    backendErrorMessage: "Не вдалося видалити курс.",
    networkErrorMessage: "Не вдалося звернутися до сервісу курсів.",
  })
}
