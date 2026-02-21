import { fetchApiJson, fetchApiResponse } from "@/lib/client-api/client"
import { parseJsonOrThrow } from "@/lib/client-api/http"
import {
  apiTabletoListSchema,
  apiTabletoSchema,
  apiTabletosUserListSchema,
  createTabletoResponseSchema,
} from "@/lib/medicines/contracts"
import {
  mapTabletosUsersToDashboardItems,
  mapTabletosUsersToPackagesByMedicineId,
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
  const [inventoryPayload, catalogPayload] = await Promise.all([
    fetchApiJson<unknown>("/api/tabletos-users"),
    fetchApiJson<unknown>("/api/tabletos"),
  ])

  const parsedInventory = apiTabletosUserListSchema.safeParse(inventoryPayload)
  if (!parsedInventory.success) {
    throw new Error("Бекенд повернув некоректний список упаковок користувача.")
  }

  const parsedCatalog = apiTabletoListSchema.safeParse(catalogPayload)
  const tabletoCatalog = parsedCatalog.success ? parsedCatalog.data : []

  return mapTabletosUsersToDashboardItems(parsedInventory.data, tabletoCatalog)
}

export async function getMedicineById(id: MedicineId): Promise<Medicine | null> {
  const [response, inventoryPayload] = await Promise.all([
    fetchApiResponse(`/api/tabletos/${id}`),
    fetchApiJson<unknown>("/api/tabletos-users"),
  ])

  if (response.status === 404) return null
  const payload = await parseJsonOrThrow<unknown>(response)
  const parsed = apiTabletoSchema.nullable().safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректні деталі препарату.")
  }
  if (!parsed.data) return null

  const medicine = mapTabletoToMedicine(parsed.data)
  const parsedInventory = apiTabletosUserListSchema.safeParse(inventoryPayload)
  if (!parsedInventory.success) return medicine

  return {
    ...medicine,
    packages: mapTabletosUsersToPackagesByMedicineId(parsedInventory.data, String(id)),
  }
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
