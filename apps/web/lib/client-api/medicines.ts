import { fetchApiJson, fetchApiResponse } from "@/lib/client-api/client"
import { parseJsonOrThrow } from "@/lib/client-api/http"
import {
  apiTabletoListSchema,
  apiTabletoSchema,
  createTabletoResponseSchema,
} from "@/lib/medicines/contracts"
import {
  mapTabletoToDashboardItem,
  mapTabletoToMedicine,
  toCreateTabletoRequest,
} from "@/lib/medicines/mappers"
import type { CreateMedicinePayload } from "@/lib/medicines/types"
import type {
  Medicine,
  MedicineCourse,
  MedicineDashboardItem,
  MedicineId,
  UpcomingDose,
} from "@/types/medicine"

export type { CreateMedicinePayload } from "@/lib/medicines/types"

export interface SearchMedicineResult {
  id: string
  name: string
  form?: string
}

export interface MedicinePreviewRequest {
  url: string
}

export interface MedicinePreviewResponse {
  sourceUrl: string
  imageUrl?: string
  name?: string
  description?: string
  form?: string
}

export async function searchMedicines(
  query: string
): Promise<SearchMedicineResult[]> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  return fetchApiJson<SearchMedicineResult[]>(
    `/api/tabletos/search?query=${encodeURIComponent(normalizedQuery)}`
  )
}

export async function previewMedicineFromUrl(
  payload: MedicinePreviewRequest
): Promise<MedicinePreviewResponse> {
  return fetchApiJson<MedicinePreviewResponse>("/api/tabletos/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function createMedicine(
  payload: CreateMedicinePayload
): Promise<{ id: string }> {
  const requestBody = toCreateTabletoRequest(payload)
  const created = await fetchApiJson<unknown>("/api/tabletos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  })

  const parsed = createTabletoResponseSchema.parse(created)
  return { id: String(parsed.Id) }
}

export async function getMedicines(): Promise<MedicineDashboardItem[]> {
  const payload = await fetchApiJson<unknown>("/api/tabletos")
  const parsed = apiTabletoListSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректний список препаратів.")
  }

  return parsed.data.map((item) => mapTabletoToDashboardItem(item))
}

export async function getMedicineById(id: MedicineId): Promise<Medicine | null> {
  const response = await fetchApiResponse(`/api/tabletos/${id}`)
  if (response.status === 404) return null

  const payload = await parseJsonOrThrow<unknown>(response)
  const parsed = apiTabletoSchema.nullable().safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректні деталі препарату.")
  }

  return parsed.data ? mapTabletoToMedicine(parsed.data) : null
}

export async function getUpcomingDoses(): Promise<UpcomingDose[]> {
  return []
}

export async function getMedicineCoursesById(
  id: MedicineId
): Promise<MedicineCourse[]> {
  void id
  return []
}

export async function getMedicineCourses(): Promise<MedicineCourse[]> {
  return []
}
