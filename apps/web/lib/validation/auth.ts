import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Введи коректний email."),
  password: z.string().min(8, "Пароль має містити щонайменше 8 символів."),
})

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Імʼя має містити щонайменше 2 символи."),
  surname: z
    .string()
    .trim()
    .min(2, "Прізвище має містити щонайменше 2 символи."),
  username: z
    .string()
    .trim()
    .min(3, "Username має містити щонайменше 3 символи."),
  email: z.string().email("Введи коректний email."),
  password: z.string().min(8, "Пароль має містити щонайменше 8 символів."),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
