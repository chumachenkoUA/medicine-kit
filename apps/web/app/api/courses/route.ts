import {
  badRequestResponse,
  forwardBackendRequest,
  parseJsonBody,
  readAccessToken,
  unauthorizedResponse,
} from "@/app/api/_shared/proxy"
import { createCourseRequestSchema } from "@/lib/medicines/contracts"

export async function GET() {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  return forwardBackendRequest({
    path: "/courses",
    method: "GET",
    token,
    networkErrorMessage: "Не вдалося завантажити курси.",
  })
}

export async function POST(request: Request) {
  const token = await readAccessToken()
  if (!token) {
    return unauthorizedResponse()
  }

  const parsedBody = await parseJsonBody(request)
  if (!parsedBody.ok) return parsedBody.response

  const parsed = createCourseRequestSchema.safeParse(parsedBody.data)
  if (!parsed.success) {
    return badRequestResponse("Некоректні дані для створення курсу.")
  }

  return forwardBackendRequest({
    path: "/courses",
    method: "POST",
    token,
    body: {
      ...parsed.data,
      description: parsed.data.description?.trim() || undefined,
    },
    backendErrorMessage: "Не вдалося створити курс.",
    networkErrorMessage: "Не вдалося звернутися до сервісу курсів.",
  })
}
