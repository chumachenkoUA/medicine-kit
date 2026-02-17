import {
  AlertTriangle,
  CalendarClock,
  CircleCheck,
  Clock3,
  Search,
  SlidersHorizontal,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MedicineBentoGrid } from "@/components/dashboard/medicine-bento-grid"
import { doseStatusClassMap, isExpiringSoon, isLowStock } from "@/lib/medicine"
import { getMedicines, getUpcomingDoses } from "@/services/medicine.service"
import type { MedicineDashboardItem, UpcomingDose } from "@/types/medicine"

const statusIconMap: Record<UpcomingDose["status"], typeof Clock3> = {
  now: CircleCheck,
  soon: CalendarClock,
  scheduled: Clock3,
  missed: AlertTriangle,
}

export default async function DashboardPage() {
  let dueNow: UpcomingDose[] = []
  let medicines: MedicineDashboardItem[] = []
  let medicinesError: string | null = null

  try {
    ;[dueNow, medicines] = await Promise.all([getUpcomingDoses(), getMedicines()])
  } catch {
    medicinesError = "Спробуй оновити сторінку пізніше."
  }

  const lowStockCount = medicines.filter(isLowStock).length
  const expiringSoonCount = medicines.filter(isExpiringSoon).length

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
                    <Button size="sm" variant="outline">
                      Відмітити
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
            <Badge variant="outline">Активні: {medicines.length}</Badge>
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-800 dark:border-amber-500/40 dark:text-amber-200"
            >
              Закінчуються: {lowStockCount}
            </Badge>
            <Badge
              variant="outline"
              className="border-orange-300 text-orange-800 dark:border-orange-500/40 dark:text-orange-200"
            >
              Скоро термін: {expiringSoonCount}
            </Badge>
          </div>
        </div>

        <Card className="sticky top-20 z-20 border-border/70 bg-background/95 shadow-sm backdrop-blur-md dark:bg-card/95">
          <CardContent className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Пошук ліків..."
                className="border-border/70 bg-card pl-9 dark:bg-input/40"
              />
            </div>
            <Select defaultValue="name">
              <SelectTrigger className="w-full border-border/70 bg-card md:w-52 dark:bg-input/40">
                <SelectValue placeholder="Сортування" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">За назвою</SelectItem>
                <SelectItem value="time">За часом</SelectItem>
                <SelectItem value="stock">За залишком</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 border-border/80 md:ml-auto">
              <SlidersHorizontal className="size-4" />
              Фільтри
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
                0
              </Badge>
            </Button>
          </CardContent>
        </Card>

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
                <Button variant="outline" size="sm">
                  Спробувати ще раз
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
          <MedicineBentoGrid medicines={medicines} />
        )}
      </section>
    </div>
  )
}
