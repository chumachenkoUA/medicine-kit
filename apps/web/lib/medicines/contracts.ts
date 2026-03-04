import { z } from "zod"

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

export const apiTabletoSchema = z.object({
  Id: z.union([z.number(), z.string()]),
  Name: z.string(),
  Description: z.string().nullish(),
  Format: z.string(),
  Quantity: z.coerce.number().nonnegative(),
  imageUrl: optionalTextSchema,
  photo: optionalTextSchema,
  Photo: optionalTextSchema,
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
  Quantity_week: z.coerce.number().int().positive().optional(),
  Description: z.string().nullish(),
  Start_date: z.string().nullish(),
  End_date: z.string().nullish(),
  Dose_times: z.array(z.string()).nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  Status: z.string().nullish(),
  status: z.string().nullish(),
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

export const createTabletosUserRequestSchema = z.object({
  tabletoId: z.coerce.number().int().positive(),
  count: z.coerce.number().int().positive(),
  expirationDate: z.string().date(),
  createDate: z.string().datetime(),
})

export const createCourseRequestSchema = z.object({
  nameDoctor: z.string().trim().min(1),
  period: z.coerce.number().int().positive(),
  qtyDay: z.coerce.number().int().positive(),
  startDate: z.string().date(),
  description: z.string().trim().optional(),
  tabletoId: z.coerce.number().int().positive(),
  status: z.enum(["active", "planned", "completed", "paused"]).optional(),
  doseTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).optional(),
})

export const apiCourseCalendarEventSchema = z.object({
  id: z.string(),
  courseId: z.union([z.number(), z.string()]),
  medicineId: z.union([z.number(), z.string()]),
  medicineName: z.string().optional(),
  doctorName: z.string().optional(),
  title: z.string(),
  doseTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(["scheduled", "taken", "missed", "skipped"]),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean(),
})

export const apiCourseCalendarListSchema = z.array(apiCourseCalendarEventSchema)

export const upsertCourseDoseLogRequestSchema = z.object({
  date: z.string().date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  state: z.enum(["taken", "missed", "skipped"]),
})

export const courseProgressSchema = z.object({
  courseId: z.union([z.number(), z.string()]),
  from: z.string().nullish(),
  to: z.string().nullish(),
  total: z.coerce.number().int().nonnegative(),
  taken: z.coerce.number().int().nonnegative(),
  missed: z.coerce.number().int().nonnegative(),
  skipped: z.coerce.number().int().nonnegative(),
  remaining: z.coerce.number().int().nonnegative(),
  adherencePercent: z.coerce.number().int().min(0).max(100),
})

export const courseStockWarningSchema = z.object({
  courseId: z.union([z.number(), z.string()]),
  medicineId: z.union([z.number(), z.string()]),
  medicineName: z.string(),
  courseStatus: z.string(),
  stockCount: z.coerce.number().int().nonnegative(),
  dailyNeed: z.coerce.number().int().positive(),
  daysLeftEstimate: z.coerce.number().nonnegative(),
  severity: z.enum(["ok", "low", "empty"]),
  message: z.string(),
  courseEndDate: z.string().nullish(),
})

export const courseStockWarningListSchema = z.array(courseStockWarningSchema)

const apiIdLikeSchema = z.union([z.number(), z.string()])

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
export type CreateTabletosUserRequest = z.infer<typeof createTabletosUserRequestSchema>
export type CreateCourseRequest = z.infer<typeof createCourseRequestSchema>
export type ApiCourseCalendarEvent = z.infer<typeof apiCourseCalendarEventSchema>
export type UpsertCourseDoseLogRequest = z.infer<typeof upsertCourseDoseLogRequestSchema>
export type CourseProgressContract = z.infer<typeof courseProgressSchema>
export type CourseStockWarningContract = z.infer<typeof courseStockWarningSchema>
export type MedicineSearchResultContract = z.infer<typeof medicineSearchResultSchema>
export type MedicinePreviewResponseContract = z.infer<typeof medicinePreviewResponseSchema>
export type CreateMedicineResponseContract = z.infer<typeof createMedicineResponseSchema>
