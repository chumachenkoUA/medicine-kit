import { CalendarClock, Clock3, Pill } from "lucide-react"

import { PageShell } from "@/components/dashboard/page-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getMedicineCourses,
  getMedicines,
  getUpcomingDoses,
} from "@/lib/client-api/medicines"

export default async function SchedulePage() {
  const [upcomingDoses, courses, medicines] = await Promise.all([
    getUpcomingDoses(),
    getMedicineCourses(),
    getMedicines(),
  ])

  const medicineNameById = new Map(medicines.map((medicine) => [medicine.id, medicine.name]))

  const activeCourses = courses.filter((course) => course.status === "active")
  const plannedCourses = courses.filter((course) => course.status === "planned")

  return (
    <PageShell
      title="Розклад прийому"
      description="План прийомів по днях, нагадування і швидкий перегляд активних курсів."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-border/70 bg-card/95 xl:col-span-2 dark:bg-card">
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
              </p>
            ) : (
              upcomingDoses.map((dose) => (
                <div
                  key={`${dose.id}-${dose.time}`}
                  className="flex items-center justify-between rounded-lg border p-3"
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
          <CardContent className="space-y-2">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Активні</p>
              <p className="text-xl font-semibold">{activeCourses.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Заплановані</p>
              <p className="text-xl font-semibold">{plannedCourses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  Період: {course.periodStart} - {course.periodEnd}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
