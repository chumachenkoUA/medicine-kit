import {
  badRequestResponse,
  forwardBackendRequest,
  parseJsonBody,
  parseNumericId,
  readAccessToken,
  unauthorizedResponse,
} from "@/app/api/_shared/proxy"

interface RouteParams {
  params: Promise<{ id: string }>
}

function toBackendPath(id: string): string | null {
  const normalized = parseNumericId(id)
  if (!normalized) return null
  return `/tabletos-users/${normalized}`
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const { id } = await params
  const backendPath = toBackendPath(id)
  if (!backendPath) {
    return badRequestResponse("Некоректний ID упаковки.")
  }

  const parsedBody = await parseJsonBody(request)
  if (!parsedBody.ok) return parsedBody.response

  return forwardBackendRequest({
    path: backendPath,
    method: "PATCH",
    token,
    body: parsedBody.data,
    backendErrorMessage: "Не вдалося оновити упаковку.",
    networkErrorMessage: "Не вдалося звернутися до сервісу упаковок.",
  })
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const { id } = await params
  const backendPath = toBackendPath(id)
  if (!backendPath) {
    return badRequestResponse("Некоректний ID упаковки.")
  }

  return forwardBackendRequest({
    path: backendPath,
    method: "DELETE",
    token,
    backendErrorMessage: "Не вдалося видалити упаковку.",
    networkErrorMessage: "Не вдалося звернутися до сервісу упаковок.",
  })
}
