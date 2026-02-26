import {
  AlertTriangle,
  CalendarClock,
  CircleCheck,
  Clock3,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MedicineInventoryPanel } from "@/components/dashboard/medicine-inventory-panel"
import { doseStatusClassMap } from "@/lib/medicine"
import {
  computeUpcomingDoses,
  getMedicineCourses,
  getMedicines,
} from "@/lib/client-api/medicines"
import type {
  MedicineCourse,
  MedicineDashboardItem,
  UpcomingDose,
} from "@/types/medicine"

const statusIconMap: Record<UpcomingDose["status"], typeof Clock3> = {
  now: CircleCheck,
  soon: CalendarClock,
  scheduled: Clock3,
  missed: AlertTriangle,
}

export default async function DashboardPage() {
  let dueNow: UpcomingDose[] = []
  let medicines: MedicineDashboardItem[] = []
  let courses: MedicineCourse[] = []
  let medicinesError: string | null = null

  try {
    ;[medicines, courses] = await Promise.all([
      getMedicines({ sort: "name_asc" }),
      getMedicineCourses(),
    ])
    dueNow = computeUpcomingDoses(courses, medicines)
  } catch {
    medicinesError = "Спробуй оновити сторінку пізніше."
  }

  return (
    <div className="grid gap-6 md:gap-7">
      <section
        className="dashboard-reveal space-y-4 rounded-3xl border border-border/70 bg-card/80 p-4 md:p-5 dark:bg-card/95"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold md:text-xl">
            Що прийняти зараз або найближчим часом
          </h2>
          <Badge variant="outline" className="hidden md:inline-flex">
            Потрібна увага: {dueNow.length}
          </Badge>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {dueNow.length === 0 ? (
            <Card className="lg:col-span-3">
              <CardContent className="py-8 text-sm text-muted-foreground">
                Немає запланованих прийомів на найближчий час.
              </CardContent>
            </Card>
          ) : (
            dueNow.map((item) => {
              const StatusIcon = statusIconMap[item.status]

              return (
                <Card
                  key={item.id}
                  className="border-border/70 bg-background/95 shadow-sm transition-shadow hover:shadow-md dark:bg-card/90 dark:hover:shadow-black/20"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between gap-3 text-base">
                      <span className="line-clamp-1">{item.medicineName}</span>
                      <Badge
                        className={`gap-1.5 border px-2.5 py-1 ${doseStatusClassMap[item.status]}`}
                      >
                        <StatusIcon className="size-3.5" />
                        {item.statusLabel}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="size-4" />
                      {item.time}
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/schedule">До розкладу</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </section>

      <section
        className="dashboard-reveal space-y-4"
        style={{ animationDelay: "70ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Усі ліки в аптечці</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/create-medicine">Додати ліки</Link>
            </Button>
          </div>
        </div>

        {medicinesError ? (
          <Card className="border-destructive/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-destructive">
                Не вдалося завантажити ліки
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {medicinesError}
              <div className="mt-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">Оновити сторінку</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : medicines.length === 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Поки що немає препаратів</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Додай перший препарат, щоб побачити його в дашборді.
            </CardContent>
          </Card>
        ) : (
          <MedicineInventoryPanel medicines={medicines} />
        )}
      </section>
    </div>
  )
}
