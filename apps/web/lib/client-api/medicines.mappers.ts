import {
  createMedicineResponseSchema,
  medicinePreviewResponseSchema,
  medicineSearchResultListSchema,
  type CreateMedicineResponseContract,
  type MedicinePreviewResponseContract,
  type MedicineSearchResultContract,
} from "@/lib/medicines/contracts"

export function mapSearchMedicinesPayload(
  payload: unknown
): MedicineSearchResultContract[] {
  const parsed = medicineSearchResultListSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректний результат пошуку препаратів.")
  }

  return parsed.data
}

export function mapPreviewMedicinePayload(
  payload: unknown,
  requestedUrl: string
): MedicinePreviewResponseContract {
  const parsed = medicinePreviewResponseSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректний результат попереднього перегляду.")
  }

  return {
    ...parsed.data,
    sourceUrl: parsed.data.sourceUrl || requestedUrl,
  }
}

export function mapCreateMedicinePayload(
  payload: unknown
): CreateMedicineResponseContract {
  const parsed = createMedicineResponseSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректну відповідь після створення препарату.")
  }

  return parsed.data
}
