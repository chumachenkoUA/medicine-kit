import { z } from "zod"
import type { CreateMedicinePayload } from "@/lib/medicines/types"

const optionalUrlInputSchema = z
  .string()
  .trim()
  .refine((value) => !value || URL.canParse(value), {
    message: "Введи коректний URL або залиш поле порожнім.",
  })

const requiredUrlInputSchema = z
  .string()
  .trim()
  .min(1, "Вкажи посилання на джерело.")
  .refine((value) => URL.canParse(value), {
    message: "Введи коректний URL джерела.",
  })

export const packageFormSchema = z.object({
  tabletsInPack: z
    .string()
    .trim()
    .min(1, "Вкажи кількість таблеток.")
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, {
      message: "Кількість має бути цілим числом більше 0.",
    }),
  expiresAt: z.string().trim().min(1, "Вкажи термін придатності."),
  batchNumber: z.string().trim(),
})

export const createMedicineFormSchema = z.object({
  name: z.string().trim().min(1, "Вкажи назву препарату."),
  description: z.string().trim(),
  form: z.string().trim().min(1, "Вкажи форму препарату."),
  imageUrl: optionalUrlInputSchema,
  sourceUrl: requiredUrlInputSchema,
  packages: z.array(packageFormSchema).min(1, "Додай хоча б одну упаковку."),
})

export type PackageFormValues = z.infer<typeof packageFormSchema>
export type CreateMedicineFormValues = z.infer<typeof createMedicineFormSchema>

export const EMPTY_PACKAGE: PackageFormValues = {
  tabletsInPack: "",
  expiresAt: "",
  batchNumber: "",
}

export const EMPTY_CREATE_MEDICINE_FORM: CreateMedicineFormValues = {
  name: "",
  description: "",
  form: "",
  imageUrl: "",
  sourceUrl: "",
  packages: [{ ...EMPTY_PACKAGE }],
}

export function toCreateMedicinePayload(
  form: CreateMedicineFormValues
): CreateMedicinePayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    form: form.form.trim(),
    imageUrl: form.imageUrl.trim() || undefined,
    sourceUrl: form.sourceUrl.trim(),
    packages: form.packages.map((pack) => ({
      tabletsInPack: Number(pack.tabletsInPack),
      expiresAt: pack.expiresAt,
      batchNumber: pack.batchNumber.trim() || undefined,
    })),
  }
}
