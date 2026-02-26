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

const DEFAULT_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 12
const MAX_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

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

function parseJwtExp(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1]
    if (!payloadPart) return null

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    const payloadRaw = Buffer.from(padded, "base64").toString("utf8")
    const payload = JSON.parse(payloadRaw) as { exp?: unknown }
    const exp = Number(payload.exp)

    return Number.isFinite(exp) ? exp : null
  } catch {
    return null
  }
}

function resolveTokenMaxAge(token: string): number {
  const expSeconds = parseJwtExp(token)
  if (expSeconds == null) return DEFAULT_TOKEN_MAX_AGE_SECONDS

  const nowSeconds = Math.floor(Date.now() / 1000)
  const secondsUntilExpiry = Math.max(0, expSeconds - nowSeconds)
  if (secondsUntilExpiry === 0) return 1

  return Math.min(secondsUntilExpiry, MAX_TOKEN_MAX_AGE_SECONDS)
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
      maxAge: resolveTokenMaxAge(data.access_token),
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
