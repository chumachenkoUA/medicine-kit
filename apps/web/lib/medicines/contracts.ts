import { z } from "zod"

export const apiTabletoSchema = z.object({
  Id: z.union([z.number(), z.string()]),
  Name: z.string(),
  Description: z.string().nullish(),
  Format: z.string(),
  Quantity: z.coerce.number().nonnegative(),
})

export const apiTabletoListSchema = z.array(apiTabletoSchema)

export const apiTabletosUserSchema = z.object({
  Id: z.union([z.number(), z.string()]),
  Count: z.coerce.number().int().nonnegative(),
  Expiration_date: z.string().nullish(),
  Create_date: z.string().nullish(),
  tabletos_id: z.union([z.number(), z.string()]).nullish(),
  tabletoId: z.union([z.number(), z.string()]).nullish(),
  tabletos: apiTabletoSchema.partial().nullish(),
  tableto: apiTabletoSchema.partial().nullish(),
})

export const apiTabletosUserListSchema = z.array(apiTabletosUserSchema)

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
export type ApiTabletosUser = z.infer<typeof apiTabletosUserSchema>
export type CreateTabletoRequest = z.infer<typeof createTabletoRequestSchema>
