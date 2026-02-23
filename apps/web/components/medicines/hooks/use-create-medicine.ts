"use client"

import {
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query"
import {
  createMedicine,
  type CreateMedicinePayload,
} from "@/lib/client-api/medicines"

type CreateMedicineMutationOptions = Omit<
  UseMutationOptions<{ id: string }, Error, CreateMedicinePayload, unknown>,
  "mutationFn"
>

export function useCreateMedicine(options?: CreateMedicineMutationOptions) {
  return useMutation<{ id: string }, Error, CreateMedicinePayload>({
    mutationFn: createMedicine,
    ...options,
  })
}
