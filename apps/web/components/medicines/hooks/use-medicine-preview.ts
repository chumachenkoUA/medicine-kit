"use client"

import {
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query"
import {
  previewMedicineFromUrl,
  type MedicinePreviewRequest,
  type MedicinePreviewResponse,
} from "@/lib/client-api/medicines"

type PreviewMutationOptions = Omit<
  UseMutationOptions<
    MedicinePreviewResponse,
    Error,
    MedicinePreviewRequest,
    unknown
  >,
  "mutationFn"
>

export function useMedicinePreview(options?: PreviewMutationOptions) {
  return useMutation<MedicinePreviewResponse, Error, MedicinePreviewRequest>({
    mutationFn: previewMedicineFromUrl,
    ...options,
  })
}
