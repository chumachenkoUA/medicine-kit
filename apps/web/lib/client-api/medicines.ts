import { fetchApiJson, fetchApiResponse } from "@/lib/client-api/client"
import { parseJsonOrThrow } from "@/lib/client-api/http"
import { normalizeClientError } from "@/lib/client-api/errors"
import {
  mapCreateMedicinePayload,
  mapPreviewMedicinePayload,
  mapSearchMedicinesPayload,
} from "@/lib/client-api/medicines.mappers"
import {
  apiCourseListSchema,
  apiTabletoListSchema,
  apiTabletoSchema,
  apiTabletosUserListSchema,
  type MedicinePreviewResponseContract,
  type MedicineSearchResultContract,
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
export type SearchMedicineResult = MedicineSearchResultContract

export interface MedicinePreviewRequest {
  url: string
}
export type MedicinePreviewResponse = MedicinePreviewResponseContract

function parseCourseDate(value?: string | null): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function normalizeCourseStatus(value?: string | null): MedicineCourse["status"] {
  const normalized = value?.trim().toLowerCase()

  if (
    normalized === "active" ||
    normalized === "planned" ||
    normalized === "completed" ||
    normalized === "paused"
  ) {
    return normalized
  }

  if (normalized === "in_progress") return "active"
  if (normalized === "done") return "completed"
  if (normalized === "pending") return "planned"
  return "planned"
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
  query: string,
  options?: { signal?: AbortSignal }
): Promise<SearchMedicineResult[]> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  try {
    const payload = await fetchApiJson<unknown>(
      `/api/tabletos/search?query=${encodeURIComponent(normalizedQuery)}`,
      { signal: options?.signal }
    )

    return mapSearchMedicinesPayload(payload)
  } catch (error) {
    throw normalizeClientError(error, "Не вдалося виконати пошук препаратів.")
  }
}

export async function previewMedicineFromUrl(
  payload: MedicinePreviewRequest
): Promise<MedicinePreviewResponse> {
  try {
    const responsePayload = await fetchApiJson<unknown>("/api/tabletos/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    return mapPreviewMedicinePayload(responsePayload, payload.url)
  } catch (error) {
    throw normalizeClientError(
      error,
      "Не вдалося отримати попередні дані з посилання."
    )
  }
}

export async function createMedicine(
  payload: CreateMedicinePayload
): Promise<{ id: string }> {
  const requestBody = toCreateTabletoRequest(payload)
  const createDate = new Date().toISOString()

  const createPackages = async (tabletoId: number) => {
    if (payload.packages.length === 0) return

    for (const pack of payload.packages) {
      await fetchApiJson<unknown>("/api/tabletos-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabletoId,
          count: pack.tabletsInPack,
          expirationDate: pack.expiresAt,
          createDate,
        }),
      })
    }
  }

  const rollbackCreatedMedicine = async (tabletoId: number): Promise<boolean> => {
    try {
      const response = await fetchApiResponse(`/api/tabletos/${tabletoId}`, {
        method: "DELETE",
      })
      return response.ok
    } catch {
      return false
    }
  }

  try {
    const responsePayload = await fetchApiJson<unknown>("/api/tabletos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })

    const created = mapCreateMedicinePayload(responsePayload)
    const tabletoId = Number(created.id)
    if (!Number.isInteger(tabletoId) || tabletoId <= 0) {
      throw new Error("Не вдалося визначити ID створеного препарату.")
    }

    try {
      await createPackages(tabletoId)
    } catch (error) {
      const rollbackSucceeded = await rollbackCreatedMedicine(tabletoId)
      const fallbackMessage = rollbackSucceeded
        ? "Не вдалося додати всі упаковки. Створений препарат автоматично відкотили."
        : "Не вдалося додати всі упаковки, а автоматичний rollback не вдався. Перевір препарат у списку."

      throw normalizeClientError(error, fallbackMessage)
    }

    return created
  } catch (error) {
    throw normalizeClientError(error, "Не вдалося створити препарат.")
  }
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

export function computeUpcomingDoses(
  courses: MedicineCourse[],
  medicines: MedicineDashboardItem[]
): UpcomingDose[] {
  if (courses.length === 0) return []

  const medicineNameById = new Map(medicines.map((medicine) => [medicine.id, medicine.name]))
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setHours(23, 59, 59, 999)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const toMinutes = (value: string): number | null => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
    if (!match) return null

    const hours = Number(match[1])
    const minutes = Number(match[2])
    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null
    }

    return hours * 60 + minutes
  }

  return courses
    .flatMap((course) => {
      if (course.status !== "active") return []
      if (!course.periodStart || !course.periodEnd) return []

      const start = new Date(course.periodStart)
      const end = new Date(course.periodEnd)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
      if (todayEnd < start || todayStart > end) return []

      return course.times.flatMap((time, index) => {
        const minutes = toMinutes(time)
        if (minutes == null) return []

        const delta = minutes - nowMinutes
        const status: UpcomingDose["status"] =
          delta < -30 ? "missed" : delta <= 15 ? "now" : delta <= 120 ? "soon" : "scheduled"
        const statusLabel =
          status === "missed"
            ? "Пропущено"
            : status === "now"
              ? "Зараз"
              : status === "soon"
                ? "Скоро"
                : "Заплановано"

        return {
          id: `${course.id}-${index}`,
          medicineName: medicineNameById.get(course.medicineId) ?? "Невідомо",
          time,
          status,
          statusLabel,
        } satisfies UpcomingDose
      })
    })
    .sort((a, b) => {
      const aMinutes = toMinutes(a.time) ?? 0
      const bMinutes = toMinutes(b.time) ?? 0
      return aMinutes - bMinutes
    })
    .slice(0, 6)
}

export async function getUpcomingDoses(): Promise<UpcomingDose[]> {
  const [courses, medicines] = await Promise.all([getMedicineCourses(), getMedicines()])
  return computeUpcomingDoses(courses, medicines)
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

  return parsed.data.map((course) => {
    const periodDays = Math.max(1, Number(course.Period_courses) || 1)
    const periodStart = parseCourseDate(course.Start_date ?? course.startDate)
    const periodEnd = parseCourseDate(course.End_date ?? course.endDate)
    const status = normalizeCourseStatus(course.Status ?? course.status)

    return {
      id: String(course.Id),
      medicineId: String(course.tabletos_id),
      title: course.Description?.trim()
        ? course.Description
        : `Курс від ${course.Name_doctor}`,
      dosage: `${course.Quantity_day} табл./день`,
      frequency: `${course.Quantity_week} дн./тижд.`,
      times: buildTimesByQuantityDay(Number(course.Quantity_day) || 1),
      periodDays,
      periodStart,
      periodEnd,
      status,
    } satisfies MedicineCourse
  })
}
