import { fetchApiJson, fetchApiResponse } from "@/lib/client-api/client"
import { parseJsonOrThrow } from "@/lib/client-api/http"
import {
  apiCourseListSchema,
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
  description?: string
  sourceUrl?: string
  imageUrl?: string
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

function buildTimesByQuantityDay(quantityDay: number): string[] {
  if (quantityDay <= 1) return ["08:00"]
  if (quantityDay === 2) return ["08:00", "20:00"]
  if (quantityDay === 3) return ["08:00", "14:00", "20:00"]
  return Array.from({ length: quantityDay }, (_, index) =>
    `${String((8 + index * 2) % 24).padStart(2, "0")}:00`
  )
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
  if (!/^\d+$/.test(String(id))) return null

  const response = await fetchApiResponse(`/api/tabletos/${id}`)

  if (response.status === 404) return null
  if (!response.ok) return null

  let payload: unknown
  try {
    payload = await parseJsonOrThrow<unknown>(response)
  } catch {
    return null
  }
  const parsed = apiTabletoSchema.nullable().safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректні деталі препарату.")
  }
  if (!parsed.data) return null

  const medicine = mapTabletoToMedicine(parsed.data)
  try {
    const inventoryPayload = await fetchApiJson<unknown>("/api/tabletos-users")
    const parsedInventory = apiTabletosUserListSchema.safeParse(inventoryPayload)
    if (!parsedInventory.success) return medicine

    return {
      ...medicine,
      packages: mapTabletosUsersToPackagesByMedicineId(parsedInventory.data, String(id)),
    }
  } catch {
    return medicine
  }
}

export async function getUpcomingDoses(): Promise<UpcomingDose[]> {
  return []
}

export async function getMedicineCoursesById(
  id: MedicineId
): Promise<MedicineCourse[]> {
  const courses = await getMedicineCourses()
  return courses.filter((course) => course.medicineId === id)
}

export async function getMedicineCourses(): Promise<MedicineCourse[]> {
  const payload = await fetchApiJson<unknown>("/api/courses")
  const parsed = apiCourseListSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректний список курсів.")
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return parsed.data.map((course) => {
    const periodDays = Math.max(1, Number(course.Period_courses) || 1)
    const start = new Date(today)
    const end = new Date(today)
    end.setDate(end.getDate() + periodDays - 1)

    return {
      id: String(course.Id),
      medicineId: String(course.tabletos_id),
      title: course.Description?.trim()
        ? course.Description
        : `Курс від ${course.Name_doctor}`,
      dosage: `${course.Quantity_day} табл./день`,
      frequency: `${course.Quantity_week} дн./тижд.`,
      times: buildTimesByQuantityDay(Number(course.Quantity_day) || 1),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      status: "active",
    } satisfies MedicineCourse
  })
}
