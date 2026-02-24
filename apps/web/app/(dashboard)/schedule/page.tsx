import { CalendarClock, Clock3, Pill } from "lucide-react"

import { CourseProgressCalendar } from "@/components/schedule/course-progress-calendar"
import { PageShell } from "@/components/dashboard/page-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/date"
import {
  computeUpcomingDoses,
  getMedicineCourses,
  getMedicines,
} from "@/lib/client-api/medicines"
import type { MedicineCourse } from "@/types/medicine"

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

export default async function SchedulePage() {
  const [medicines, courses] = await Promise.all([getMedicines(), getMedicineCourses()])
  const upcomingDoses = computeUpcomingDoses(courses, medicines)

  const medicineNameById = new Map(medicines.map((medicine) => [medicine.id, medicine.name]))
  const medicineNameRecord = Object.fromEntries(medicineNameById.entries())

  const activeCourses = courses.filter((course) => course.status === "active")
  const plannedCourses = courses.filter((course) => course.status === "planned")
  const completedCourses = courses.filter((course) => course.status === "completed")
  const coursesWithDates = courses.filter(hasDateRange)
  const coursesWithoutDatesCount = courses.length - coursesWithDates.length

  return (
    <PageShell
      title="Розклад прийому"
      description="План прийомів по днях, нагадування і швидкий перегляд активних курсів."
    >
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
                  <Badge>{course.frequency}</Badge>
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
                  <Badge variant="secondary">{course.frequency}</Badge>
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
    </PageShell>
  )
}
