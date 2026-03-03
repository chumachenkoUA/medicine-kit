"use client"

import { useMemo, useState } from "react"
import { CalendarClock, Clock3, Pill } from "lucide-react"

import { CourseActions } from "@/components/schedule/course-actions"
import { CourseProgressCalendar } from "@/components/schedule/course-progress-calendar"
import { CreateCourseForm } from "@/components/schedule/create-course-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/date"
import {
  computeUpcomingDoses,
  createMedicineCourse,
  deleteMedicineCourse,
  type CreateMedicineCoursePayload,
  type UpdateMedicineCoursePayload,
  updateMedicineCourse,
} from "@/lib/client-api/medicines"
import type { MedicineCourse, MedicineDashboardItem } from "@/types/medicine"

interface ScheduleInteractiveProps {
  medicines: MedicineDashboardItem[]
  initialCourses: MedicineCourse[]
}

function hasDateRange(course: MedicineCourse): boolean {
  if (!course.periodStart || !course.periodEnd) return false
  const start = new Date(course.periodStart)
  const end = new Date(course.periodEnd)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
  return start <= end
}

function formatCoursePeriod(course: MedicineCourse): string {
  const { periodStart, periodEnd } = course
  if (hasDateRange(course) && periodStart && periodEnd) {
    return `${formatDate(periodStart)} - ${formatDate(periodEnd)}`
  }

  return `Тривалість: ${course.periodDays} днів (дати не задані в API)`
}

function toCourseTimes(quantityDay: number): string[] {
  if (quantityDay <= 1) return ["08:00"]
  if (quantityDay === 2) return ["08:00", "20:00"]
  if (quantityDay === 3) return ["08:00", "14:00", "20:00"]
  return Array.from({ length: quantityDay }, (_, index) =>
    `${String((8 + index * 2) % 24).padStart(2, "0")}:00`
  )
}

function toCourseEndDate(startDate: string, periodDays: number): string {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + Math.max(1, periodDays) - 1)
  return end.toISOString()
}

function applyCoursePatch(
  source: MedicineCourse,
  payload: UpdateMedicineCoursePayload
): MedicineCourse {
  const qtyPerDay = payload.qtyDay ?? source.qtyPerDay
  const periodDays = payload.period ?? source.periodDays
  const periodStart =
    payload.startDate != null
      ? new Date(payload.startDate).toISOString()
      : source.periodStart
  const periodEnd = periodStart ? toCourseEndDate(periodStart, periodDays) : source.periodEnd
  const doctorName = payload.nameDoctor?.trim() || source.doctorName
  const title = payload.description?.trim()
    ? payload.description.trim()
    : `Курс від ${doctorName}`

  return {
    ...source,
    medicineId: payload.tabletoId != null ? String(payload.tabletoId) : source.medicineId,
    doctorName,
    title,
    dosage: `${qtyPerDay} табл./день`,
    frequency: `${qtyPerDay} раз/день`,
    qtyPerDay,
    periodDays,
    periodStart,
    periodEnd,
    times: toCourseTimes(qtyPerDay),
  }
}

export function ScheduleInteractive({
  medicines,
  initialCourses,
}: ScheduleInteractiveProps) {
  const [courses, setCourses] = useState(initialCourses)

  const upcomingDoses = useMemo(
    () => computeUpcomingDoses(courses, medicines),
    [courses, medicines]
  )
  const medicineNameById = useMemo(
    () => new Map(medicines.map((medicine) => [medicine.id, medicine.name])),
    [medicines]
  )
  const medicineNameRecord = useMemo(
    () => Object.fromEntries(medicineNameById.entries()),
    [medicineNameById]
  )

  const activeCourses = courses.filter((course) => course.status === "active")
  const plannedCourses = courses.filter((course) => course.status === "planned")
  const completedCourses = courses.filter((course) => course.status === "completed")
  const coursesWithDates = courses.filter(hasDateRange)
  const coursesWithoutDatesCount = courses.length - coursesWithDates.length

  const handleCreateCourse = async (payload: CreateMedicineCoursePayload) => {
    const tempId = `tmp-${Date.now()}`
    const qtyPerDay = payload.qtyDay
    const periodStart = new Date(payload.startDate).toISOString()
    const optimisticCourse: MedicineCourse = {
      id: tempId,
      medicineId: String(payload.tabletoId),
      doctorName: payload.nameDoctor.trim(),
      title: payload.description?.trim()
        ? payload.description.trim()
        : `Курс від ${payload.nameDoctor.trim()}`,
      dosage: `${qtyPerDay} табл./день`,
      frequency: `${qtyPerDay} раз/день`,
      qtyPerDay,
      times: toCourseTimes(qtyPerDay),
      periodDays: payload.period,
      periodStart,
      periodEnd: toCourseEndDate(periodStart, payload.period),
      status: "planned",
    }

    setCourses((prev) => [optimisticCourse, ...prev])

    try {
      const created = await createMedicineCourse(payload)
      if (!created.id) return
      setCourses((prev) =>
        prev.map((course) => (course.id === tempId ? { ...course, id: created.id } : course))
      )
    } catch (error) {
      setCourses((prev) => prev.filter((course) => course.id !== tempId))
      throw error
    }
  }

  const handleUpdateCourse = async (
    courseId: string,
    payload: UpdateMedicineCoursePayload
  ) => {
    const previousCourse = courses.find((course) => course.id === courseId)
    if (!previousCourse) return

    const optimisticCourse = applyCoursePatch(previousCourse, payload)
    setCourses((prev) =>
      prev.map((course) => (course.id === courseId ? optimisticCourse : course))
    )

    try {
      await updateMedicineCourse(courseId, payload)
    } catch (error) {
      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? previousCourse : course))
      )
      throw error
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    const index = courses.findIndex((course) => course.id === courseId)
    if (index === -1) return
    const removed = courses[index]

    setCourses((prev) => prev.filter((course) => course.id !== courseId))

    try {
      await deleteMedicineCourse(courseId)
    } catch (error) {
      setCourses((prev) => {
        const next = [...prev]
        next.splice(Math.min(index, next.length), 0, removed)
        return next
      })
      throw error
    }
  }

  return (
    <div className="space-y-4">
      <CreateCourseForm medicines={medicines} onCreateCourse={handleCreateCourse} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/95 lg:col-span-2 dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock3 className="size-4" />
              Найближчі прийоми
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDoses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Найближчих прийомів поки немає.
                {coursesWithoutDatesCount > 0
                  ? " Частина курсів не має дат початку/завершення в API."
                  : ""}
              </p>
            ) : (
              upcomingDoses.map((dose) => (
                <div
                  key={`${dose.id}-${dose.time}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{dose.medicineName}</p>
                    <p className="text-sm text-muted-foreground">{dose.time}</p>
                  </div>
                  <Badge variant="outline">{dose.statusLabel}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/95 dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="size-4" />
              Статуси курсів
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-lg border p-3 sm:min-h-24">
              <p className="text-sm text-muted-foreground">Активні</p>
              <p className="text-xl font-semibold">{activeCourses.length}</p>
            </div>
            <div className="rounded-lg border p-3 sm:min-h-24">
              <p className="text-sm text-muted-foreground">Заплановані</p>
              <p className="text-xl font-semibold">{plannedCourses.length}</p>
            </div>
            <div className="rounded-lg border p-3 sm:min-h-24">
              <p className="text-sm text-muted-foreground">Події в календарі</p>
              <p className="text-xl font-semibold">{coursesWithDates.length}</p>
            </div>
            <div className="rounded-lg border p-3 sm:min-h-24">
              <p className="text-sm text-muted-foreground">Завершені</p>
              <p className="text-xl font-semibold">{completedCourses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/95 dark:bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="size-4" />
            Календар курсів
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coursesWithDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Календар недоступний: бекенд поки не повертає дати курсів.
            </p>
          ) : (
            <CourseProgressCalendar
              courses={coursesWithDates}
              medicineNameById={medicineNameRecord}
            />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 dark:bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="size-4" />
            Активні курси
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Активних курсів поки немає.</p>
          ) : (
            activeCourses.map((course) => (
              <div key={course.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{course.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{course.frequency}</Badge>
                    <CourseActions
                      course={course}
                      medicines={medicines}
                      onUpdateCourse={handleUpdateCourse}
                      onDeleteCourse={handleDeleteCourse}
                    />
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Препарат: {medicineNameById.get(course.medicineId) ?? "Невідомо"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Дозування: {course.dosage}
                </p>
                <p className="text-sm text-muted-foreground">
                  Часи: {course.times.join(", ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCoursePeriod(course)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 dark:bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Заплановані курси</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plannedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Запланованих курсів поки немає.
            </p>
          ) : (
            plannedCourses.map((course) => (
              <div key={course.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{course.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{course.frequency}</Badge>
                    <CourseActions
                      course={course}
                      medicines={medicines}
                      onUpdateCourse={handleUpdateCourse}
                      onDeleteCourse={handleDeleteCourse}
                    />
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Препарат: {medicineNameById.get(course.medicineId) ?? "Невідомо"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCoursePeriod(course)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
