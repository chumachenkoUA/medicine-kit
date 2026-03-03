import {
  forwardBackendRequest,
  readAccessToken,
  unauthorizedResponse,
} from "@/app/api/_shared/proxy"

export async function GET() {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  return forwardBackendRequest({
    path: "/courses/stock-warnings",
    method: "GET",
    token,
    networkErrorMessage: "Не вдалося завантажити попередження по запасу.",
  })
}
