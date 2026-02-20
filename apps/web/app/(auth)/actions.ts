"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ZodError } from "zod"
import { getApiErrorMessage } from "@/lib/client-api/http"
import { ACCESS_TOKEN_COOKIE, API_BASE_URL } from "@/lib/config/api"
import { loginSchema, registerSchema } from "@/lib/validation/auth"

export interface AuthFormState {
  success: boolean
  formError?: string
  errors?: Record<string, string[]>
}

function toErrorMap(error: ZodError): Record<string, string[]> {
  const { fieldErrors } = error.flatten()
  const map: Record<string, string[]> = {}

  for (const [key, value] of Object.entries(fieldErrors)) {
    if (Array.isArray(value) && value.length > 0) {
      map[key] = value.filter((message): message is string =>
        typeof message === "string"
      )
    }
  }

  return map
}

export async function loginAction(
  _: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  })

  if (!parsed.success) {
    return { success: false, errors: toErrorMap(parsed.error) }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    })

    if (!response.ok) {
      let payload: unknown = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      return {
        success: false,
        formError: getApiErrorMessage(payload, "Не вдалося виконати вхід."),
      }
    }

    const data = (await response.json()) as { access_token?: string }
    if (!data.access_token) {
      return {
        success: false,
        formError: "Сервер не повернув токен доступу.",
      }
    }

    const cookieStore = await cookies()
    cookieStore.set(ACCESS_TOKEN_COOKIE, data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  } catch {
    return {
      success: false,
      formError: "Помилка мережі. Спробуй ще раз.",
    }
  }

  redirect("/dashboard")
}

export async function registerAction(
  _: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    surname: String(formData.get("surname") ?? "").trim(),
    username: String(formData.get("username") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  })

  if (!parsed.success) {
    return { success: false, errors: toErrorMap(parsed.error) }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    })

    if (!response.ok) {
      let payload: unknown = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      return {
        success: false,
        formError: getApiErrorMessage(payload, "Не вдалося зареєструвати акаунт."),
      }
    }
  } catch {
    return {
      success: false,
      formError: "Помилка мережі. Спробуй ще раз.",
    }
  }

  return { success: true }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  redirect("/login")
}
