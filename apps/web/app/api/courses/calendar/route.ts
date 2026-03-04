import {
  buildPathWithQuery,
  forwardBackendRequest,
  readAccessToken,
  unauthorizedResponse,
} from "@/app/api/_shared/proxy"

export async function GET(request: Request) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const url = new URL(request.url)
  const backendPath = buildPathWithQuery("/courses/calendar", {
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  })

  return forwardBackendRequest({
    path: backendPath,
    method: "GET",
    token,
    networkErrorMessage: "Не вдалося завантажити календар курсів.",
  })
}
