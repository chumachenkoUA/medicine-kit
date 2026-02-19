import { z } from "zod"

export const apiTabletoSchema = z.object({
  Id: z.union([z.number(), z.string()]),
  Name: z.string(),
  Description: z.string().nullish(),
  Format: z.string(),
  Quantity: z.coerce.number().nonnegative(),
})

export const apiTabletoListSchema = z.array(apiTabletoSchema)

export const createTabletoRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  format: z.string().min(1),
  link: z.string().url().optional(),
  photo: z.string().url().optional(),
  effects: z.string().optional(),
  rate: z.number().optional(),
})

export const createTabletoResponseSchema = z.object({
  Id: z.union([z.number(), z.string()]),
})

export type ApiTableto = z.infer<typeof apiTabletoSchema>
export type CreateTabletoRequest = z.infer<typeof createTabletoRequestSchema>
