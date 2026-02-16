"use server"

import { ZodError } from "zod"
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

  await new Promise((resolve) => setTimeout(resolve, 250))

  return { success: true }
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

  await new Promise((resolve) => setTimeout(resolve, 250))

  return { success: true }
}
