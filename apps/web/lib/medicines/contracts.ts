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

export const apiCourseSchema = z.object({
  Id: z.union([z.number(), z.string()]),
  Name_doctor: z.string(),
  Period_courses: z.coerce.number().int().positive(),
  Quantity_day: z.coerce.number().int().positive(),
  Quantity_week: z.coerce.number().int().positive(),
  Description: z.string().nullish(),
  users_id: z.union([z.number(), z.string()]),
  tabletos_id: z.union([z.number(), z.string()]),
})

export const apiCourseListSchema = z.array(apiCourseSchema)

export const createTabletoRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
  format: z.string().min(1),
  link: z.string().url(),
  photo: z.string().url().optional(),
  effects: z.string().optional(),
  rate: z.number().optional(),
})

export const createTabletoResponseSchema = z.object({
  Id: z.union([z.number(), z.string()]),
})

const apiIdLikeSchema = z.union([z.number(), z.string()])
const optionalTextSchema = z
  .string()
  .trim()
  .nullish()
  .transform((value) => {
    if (typeof value !== "string") return undefined
    return value.trim() || undefined
  })

function pickFirstText(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)
}

export const medicineSearchResultSchema = z
  .object({
    id: apiIdLikeSchema.optional(),
    Id: apiIdLikeSchema.optional(),
    name: optionalTextSchema,
    Name: optionalTextSchema,
    form: optionalTextSchema,
    Format: optionalTextSchema,
    description: optionalTextSchema,
    Description: optionalTextSchema,
    sourceUrl: optionalTextSchema,
    url: optionalTextSchema,
    link: optionalTextSchema,
    Link: optionalTextSchema,
    imageUrl: optionalTextSchema,
    photo: optionalTextSchema,
    Photo: optionalTextSchema,
  })
  .superRefine((value, context) => {
    if (value.id == null && value.Id == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Medicine search item must contain id or Id.",
      })
    }

    if (!pickFirstText(value.name, value.Name)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Medicine search item must contain name or Name.",
      })
    }
  })
  .transform((value) => ({
    id: String(value.id ?? value.Id),
    name: pickFirstText(value.name, value.Name) ?? "",
    form: pickFirstText(value.form, value.Format),
    description: pickFirstText(value.description, value.Description),
    sourceUrl: pickFirstText(value.sourceUrl, value.link, value.Link, value.url),
    imageUrl: pickFirstText(value.imageUrl, value.photo, value.Photo),
  }))

export const medicineSearchResultListSchema = z.array(medicineSearchResultSchema)

export const medicinePreviewResponseSchema = z
  .object({
    sourceUrl: optionalTextSchema,
    url: optionalTextSchema,
    link: optionalTextSchema,
    name: optionalTextSchema,
    description: optionalTextSchema,
    form: optionalTextSchema,
    imageUrl: optionalTextSchema,
    photo: optionalTextSchema,
  })
  .transform((value) => ({
    sourceUrl: pickFirstText(value.sourceUrl, value.link, value.url) ?? "",
    name: value.name,
    description: value.description,
    form: value.form,
    imageUrl: pickFirstText(value.imageUrl, value.photo),
  }))

export const createMedicineResponseSchema = z
  .object({
    id: apiIdLikeSchema.optional(),
    Id: apiIdLikeSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.id == null && value.Id == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Create medicine response must contain id or Id.",
      })
    }
  })
  .transform((value) => ({
    id: String(value.id ?? value.Id),
  }))

export type ApiTableto = z.infer<typeof apiTabletoSchema>
export type ApiTabletosUser = z.infer<typeof apiTabletosUserSchema>
export type ApiCourse = z.infer<typeof apiCourseSchema>
export type CreateTabletoRequest = z.infer<typeof createTabletoRequestSchema>
export type MedicineSearchResultContract = z.infer<typeof medicineSearchResultSchema>
export type MedicinePreviewResponseContract = z.infer<typeof medicinePreviewResponseSchema>
export type CreateMedicineResponseContract = z.infer<typeof createMedicineResponseSchema>
