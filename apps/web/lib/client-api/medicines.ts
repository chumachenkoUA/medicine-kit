import { fetchApiJson, fetchApiResponse } from "@/lib/client-api/client"
import { normalizeClientError } from "@/lib/client-api/errors"
import { getApiErrorMessage, parseJsonOrThrow } from "@/lib/client-api/http"
import {
  mapCreateMedicinePayload,
  mapPreviewMedicinePayload,
  mapSearchMedicinesPayload,
} from "@/lib/client-api/medicines.mappers"
import {
  apiCourseCalendarListSchema,
  apiCourseListSchema,
  apiTabletoSchema,
  apiTabletosUserListSchema,
  courseProgressSchema,
  courseStockWarningListSchema,
  createCourseRequestSchema,
  upsertCourseDoseLogRequestSchema,
  upsertCourseDoseLogResponseSchema,
  type MedicinePreviewResponseContract,
  type MedicineSearchResultContract,
  type UpsertCourseDoseLogResponse,
} from "@/lib/medicines/contracts"
import {
  mapTabletoToMedicine,
  mapTabletosUsersToDashboardItems,
  mapTabletosUsersToPackagesByMedicineId,
  toCreateTabletoRequest,
} from "@/lib/medicines/mappers"
import type { CreateMedicinePayload } from "@/lib/medicines/types"
import type {
  CourseCalendarEvent,
  CourseProgress,
  CourseStockWarning,
  DoseLogState,
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

export interface GetMedicinesQuery {
  search?: string
  effect?: string
  sort?: string
  showExpired?: boolean
}

export interface GetCourseCalendarQuery {
  from?: string
  to?: string
}

export interface CreateMedicineCoursePayload {
  nameDoctor: string
  period: number
  qtyDay: number
  startDate: string
  description?: string
  tabletoId: number
  status?: MedicineCourse["status"]
  doseTimes?: string[]
}

export interface UpdateMedicineCoursePayload {
  nameDoctor?: string
  period?: number
  qtyDay?: number
  startDate?: string
  description?: string
  tabletoId?: number
  status?: MedicineCourse["status"]
  doseTimes?: string[]
}

export interface UpdateMedicinePackagePayload {
  count: number
}

export interface CreateMedicinePackagePayload {
  tabletoId: number
  count: number
  expirationDate: string
}

export interface UpsertCourseDoseLogPayload {
  date: string
  time: string
  state: DoseLogState
  packageId?: number
}

export type UpsertCourseDoseLogResult = UpsertCourseDoseLogResponse

function parseCourseDate(value?: string | null): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function computeCourseEndDate(
  periodStart?: string,
  periodDays = 1
): string | undefined {
  if (!periodStart) return undefined
  const start = new Date(periodStart)
  if (Number.isNaN(start.getTime())) return undefined

  const normalizedPeriodDays = Math.max(1, periodDays)
  const end = new Date(start)
  end.setDate(start.getDate() + normalizedPeriodDays - 1)
  return end.toISOString()
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

  const startMinutes = 8 * 60
  const endMinutes = 22 * 60
  const span = endMinutes - startMinutes
  const step = span / (quantityDay - 1)

  return Array.from({ length: quantityDay }, (_, index) => {
    const minutes = Math.round(startMinutes + index * step)
    const hh = Math.floor(minutes / 60)
    const mm = minutes % 60
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
  })
}

function normalizeDoseTimes(raw: unknown, quantityDay: number): string[] {
  if (!Array.isArray(raw)) return buildTimesByQuantityDay(quantityDay)

  const normalized = raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => /^([01]\d|2[0-3]):[0-5]\d$/.test(item))

  const uniqueSorted = Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b))
  if (uniqueSorted.length > 0) return uniqueSorted

  return buildTimesByQuantityDay(quantityDay)
}

function toCourseCalendarQuery(query?: GetCourseCalendarQuery): string {
  if (!query) return ""
  const params = new URLSearchParams()
  if (query.from?.trim()) params.set("from", query.from.trim())
  if (query.to?.trim()) params.set("to", query.to.trim())
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

function toTimeMinutes(value: string): number | null {
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

export async function createMedicinePackage(
  payload: CreateMedicinePackagePayload
): Promise<void> {
  try {
    await fetchApiJson<unknown>("/api/tabletos-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tabletoId: payload.tabletoId,
        count: payload.count,
        expirationDate: payload.expirationDate,
        createDate: new Date().toISOString(),
      }),
    })
  } catch (error) {
    throw normalizeClientError(error, "Не вдалося додати упаковку препарату.")
  }
}

function toMedicinesQueryString(query?: GetMedicinesQuery): string {
  if (!query) return ""

  const params = new URLSearchParams()
  const search = query.search?.trim()
  const effect = query.effect?.trim()
  const sort = query.sort?.trim()

  if (search) params.set("search", search)
  if (effect) params.set("effect", effect)
  if (sort) params.set("sort", sort)
  if (query.showExpired === true) params.set("showExpired", "true")

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

export async function getMedicines(
  query?: GetMedicinesQuery,
  options?: { signal?: AbortSignal }
): Promise<MedicineDashboardItem[]> {
  const queryString = toMedicinesQueryString(query)
  const inventoryPayload = await fetchApiJson<unknown>(
    `/api/tabletos-users${queryString}`,
    { signal: options?.signal }
  )

  const parsedInventory = apiTabletosUserListSchema.safeParse(inventoryPayload)
  if (!parsedInventory.success) {
    throw new Error("Бекенд повернув некоректний список упаковок користувача.")
  }

  return mapTabletosUsersToDashboardItems(parsedInventory.data, [])
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

  return courses
    .flatMap((course) => {
      if (course.status !== "active") return []
      if (!course.periodStart || !course.periodEnd) return []

      const start = new Date(course.periodStart)
      const end = new Date(course.periodEnd)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
      if (todayEnd < start || todayStart > end) return []

      return course.times.flatMap((time, index) => {
        const minutes = toTimeMinutes(time)
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
    .sort((a, b) => (toTimeMinutes(a.time) ?? 0) - (toTimeMinutes(b.time) ?? 0))
    .slice(0, 6)
}

export function computeUpcomingDosesFromCalendarEvents(
  events: CourseCalendarEvent[]
): UpcomingDose[] {
  if (events.length === 0) return []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setHours(23, 59, 59, 999)

  return events
    .filter((event) => event.status !== "taken" && event.status !== "skipped")
    .filter((event) => {
      const start = new Date(event.start)
      return !Number.isNaN(start.getTime()) && start >= todayStart && start <= todayEnd
    })
    .map((event) => {
      const start = new Date(event.start)
      const deltaMinutes = Math.round((start.getTime() - now.getTime()) / 60000)
      const status: UpcomingDose["status"] =
        event.status === "missed"
          ? "missed"
          : deltaMinutes <= 15
            ? "now"
            : deltaMinutes <= 120
              ? "soon"
              : "scheduled"

      return {
        id: event.id,
        medicineName: event.medicineName,
        time: event.doseTime,
        status,
        statusLabel:
          status === "missed"
            ? "Пропущено"
            : status === "now"
              ? "Зараз"
              : status === "soon"
                ? "Скоро"
                : "Заплановано",
      }
    })
    .sort((a, b) => (toTimeMinutes(a.time) ?? 0) - (toTimeMinutes(b.time) ?? 0))
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

export async function createMedicineCourse(
  payload: CreateMedicineCoursePayload
): Promise<{ id: string }> {
  const parsed = createCourseRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Некоректні дані курсу.")
  }

  const response = await fetchApiResponse("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...parsed.data,
      description: parsed.data.description?.trim() || undefined,
    }),
  })

  if (!response.ok) {
    let errorPayload: unknown = null
    try {
      errorPayload = await parseJsonOrThrow(response)
    } catch {
      errorPayload = null
    }

    throw new Error(getApiErrorMessage(errorPayload, "Не вдалося створити курс."))
  }

  const json = await parseJsonOrThrow<Record<string, unknown>>(response)
  const id = json?.Id ?? json?.id
  if (id == null) return { id: "" }
  return { id: String(id) }
}

export async function updateMedicineCourse(
  id: MedicineId,
  payload: UpdateMedicineCoursePayload
): Promise<void> {
  const response = await fetchApiResponse(`/api/courses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (response.ok) return

  let errorPayload: unknown = null
  try {
    errorPayload = await parseJsonOrThrow(response)
  } catch {
    errorPayload = null
  }

  throw new Error(getApiErrorMessage(errorPayload, "Не вдалося оновити курс."))
}

export async function deleteMedicineCourse(id: MedicineId): Promise<void> {
  const response = await fetchApiResponse(`/api/courses/${id}`, {
    method: "DELETE",
  })

  if (response.ok) return

  let errorPayload: unknown = null
  try {
    errorPayload = await parseJsonOrThrow(response)
  } catch {
    errorPayload = null
  }

  throw new Error(getApiErrorMessage(errorPayload, "Не вдалося видалити курс."))
}

export async function updateMedicinePackage(
  id: string,
  payload: UpdateMedicinePackagePayload
): Promise<void> {
  const response = await fetchApiResponse(`/api/tabletos-users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (response.ok) return

  let errorPayload: unknown = null
  try {
    errorPayload = await parseJsonOrThrow(response)
  } catch {
    errorPayload = null
  }

  throw new Error(getApiErrorMessage(errorPayload, "Не вдалося оновити упаковку."))
}

export async function deleteMedicinePackage(id: string): Promise<void> {
  const response = await fetchApiResponse(`/api/tabletos-users/${id}`, {
    method: "DELETE",
  })

  if (response.ok) return

  let errorPayload: unknown = null
  try {
    errorPayload = await parseJsonOrThrow(response)
  } catch {
    errorPayload = null
  }

  throw new Error(getApiErrorMessage(errorPayload, "Не вдалося видалити упаковку."))
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
    const periodEnd = computeCourseEndDate(periodStart, periodDays)
    const status = normalizeCourseStatus(course.Status ?? course.status)
    const quantityDay = Math.max(1, Number(course.Quantity_day) || 1)
    const times = normalizeDoseTimes(course.Dose_times, quantityDay)

    return {
      id: String(course.Id),
      medicineId: String(course.tabletos_id),
      doctorName: course.Name_doctor,
      title: course.Description?.trim()
        ? course.Description
        : `Курс від ${course.Name_doctor}`,
      dosage: `${quantityDay} табл./день`,
      frequency: `${quantityDay} раз/день`,
      qtyPerDay: quantityDay,
      times,
      periodDays,
      periodStart,
      periodEnd,
      status,
    } satisfies MedicineCourse
  })
}

export async function getCourseCalendar(
  query?: GetCourseCalendarQuery
): Promise<CourseCalendarEvent[]> {
  const payload = await fetchApiJson<unknown>(`/api/courses/calendar${toCourseCalendarQuery(query)}`)
  const parsed = apiCourseCalendarListSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректний календар курсів.")
  }

  return parsed.data.map((event) => ({
    id: event.id,
    courseId: String(event.courseId),
    medicineId: String(event.medicineId),
    medicineName: event.medicineName?.trim() || "Невідомий препарат",
    doctorName: event.doctorName?.trim() || "Невідомо",
    title: event.title,
    doseTime: event.doseTime,
    status: event.status,
    start: new Date(event.start).toISOString(),
    end: new Date(event.end).toISOString(),
    allDay: event.allDay,
  }))
}

export async function upsertCourseDoseLog(
  courseId: MedicineId,
  payload: UpsertCourseDoseLogPayload
): Promise<UpsertCourseDoseLogResult> {
  const parsed = upsertCourseDoseLogRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Некоректні дані для відмітки прийому.")
  }

  const response = await fetchApiResponse(`/api/courses/${courseId}/dose-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  })

  if (response.ok) {
    const responsePayload = await parseJsonOrThrow<unknown>(response)
    const parsedResponse = upsertCourseDoseLogResponseSchema.safeParse(responsePayload)
    if (!parsedResponse.success) {
      throw new Error("Бекенд повернув некоректну відповідь для статусу дози.")
    }
    return parsedResponse.data
  }

  let errorPayload: unknown = null
  try {
    errorPayload = await parseJsonOrThrow(response)
  } catch {
    errorPayload = null
  }

  throw new Error(getApiErrorMessage(errorPayload, "Не вдалося зберегти статус дози."))
}

export async function getCourseProgress(
  courseId: MedicineId,
  query?: GetCourseCalendarQuery
): Promise<CourseProgress> {
  const queryString = toCourseCalendarQuery(query)
  const payload = await fetchApiJson<unknown>(`/api/courses/${courseId}/progress${queryString}`)
  const parsed = courseProgressSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректний прогрес курсу.")
  }

  return {
    courseId: String(parsed.data.courseId),
    from: parsed.data.from ?? null,
    to: parsed.data.to ?? null,
    total: parsed.data.total,
    taken: parsed.data.taken,
    missed: parsed.data.missed,
    skipped: parsed.data.skipped,
    remaining: parsed.data.remaining,
    adherencePercent: parsed.data.adherencePercent,
  }
}

export async function getCourseStockWarnings(): Promise<CourseStockWarning[]> {
  const payload = await fetchApiJson<unknown>("/api/courses/stock-warnings")
  const parsed = courseStockWarningListSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error("Бекенд повернув некоректні попередження по запасу.")
  }

  return parsed.data.map((item) => ({
    courseId: String(item.courseId),
    medicineId: String(item.medicineId),
    medicineName: item.medicineName,
    courseStatus: item.courseStatus,
    stockCount: item.stockCount,
    dailyNeed: item.dailyNeed,
    daysLeftEstimate: item.daysLeftEstimate,
    severity: item.severity,
    message: item.message,
    courseEndDate: item.courseEndDate ?? null,
  }))
}
