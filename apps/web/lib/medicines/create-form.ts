import type { CreateMedicinePayload } from "@/lib/medicines/types"

export interface PackageForm {
  tabletsInPack: string
  expiresAt: string
  batchNumber: string
}

export interface CreateMedicineFormState {
  name: string
  description: string
  form: string
  imageUrl: string
  sourceUrl: string
  packages: PackageForm[]
}

export const EMPTY_PACKAGE: PackageForm = {
  tabletsInPack: "",
  expiresAt: "",
  batchNumber: "",
}

export const EMPTY_CREATE_MEDICINE_FORM: CreateMedicineFormState = {
  name: "",
  description: "",
  form: "",
  imageUrl: "",
  sourceUrl: "",
  packages: [{ ...EMPTY_PACKAGE }],
}

export function hasValidPackage(pack: PackageForm): boolean {
  return Boolean(pack.tabletsInPack.trim() && pack.expiresAt.trim())
}

export function canSubmitCreateMedicineForm(
  form: CreateMedicineFormState
): boolean {
  return Boolean(
    form.name.trim() &&
      form.form.trim() &&
      form.packages.some((pack) => hasValidPackage(pack))
  )
}

export function toCreateMedicinePayload(
  form: CreateMedicineFormState
): CreateMedicinePayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    form: form.form.trim(),
    imageUrl: form.imageUrl.trim() || undefined,
    sourceUrl: form.sourceUrl.trim() || undefined,
    packages: form.packages
      .filter((pack) => hasValidPackage(pack))
      .map((pack) => ({
        tabletsInPack: Number(pack.tabletsInPack),
        expiresAt: pack.expiresAt,
        batchNumber: pack.batchNumber.trim() || undefined,
      })),
  }
}
