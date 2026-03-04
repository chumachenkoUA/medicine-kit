"use client"

import { useMemo, useState } from "react"
import { formatISO, isSameDay, startOfDay } from "date-fns"
import {
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  SkipForward,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/date"
import type {
  UpsertCourseDoseLogPayload,
  UpsertCourseDoseLogResult,
} from "@/lib/client-api/medicines"
import type {
  CourseCalendarEvent,
  MedicineCourse,
  MedicinePackage,
} from "@/types/medicine"

interface CourseProgressCalendarProps {
  courses: MedicineCourse[]
  events: CourseCalendarEvent[]
  medicineNameById: Record<string, string>
  medicinePackagesById: Record<string, MedicinePackage[]>
  onMarkDose: (
    courseId: string,
    payload: UpsertCourseDoseLogPayload
  ) => Promise<UpsertCourseDoseLogResult>
}

interface PackageSelectionState {
  open: boolean
  event: CourseCalendarEvent | null
  candidates: MedicinePackage[]
  selectedPackageId: string
}

function dateKey(date: Date): string {
  return formatISO(startOfDay(date), { representation: "date" })
}

function toStatusLabel(state: CourseCalendarEvent["status"]): string {
  if (state === "taken") return "Прийнято"
  if (state === "missed") return "Пропущено"
  if (state === "skipped") return "Скасовано"
  return "Заплановано"
}

function isPackageExpired(value: string): boolean {
  const expiry = new Date(value)
  if (Number.isNaN(expiry.getTime())) return false
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return expiry.getTime() < todayStart.getTime()
}

function buildResultMessage(
  event: CourseCalendarEvent,
  result: UpsertCourseDoseLogResult
): string {
  if (result.state === "taken" && result.stockDelta === -1) {
    return `Дозу о ${event.doseTime} відмічено як прийняту. Запас оновлено.`
  }

  if ((result.state === "missed" || result.state === "skipped") && result.stockDelta === 1) {
    return `Статус о ${event.doseTime} змінено на «${toStatusLabel(result.state)}». Таблетку повернуто в упаковку.`
  }

  return `Статус о ${event.doseTime} оновлено: ${toStatusLabel(result.state)}.`
}

const emptyPackageSelectionState: PackageSelectionState = {
  open: false,
  event: null,
  candidates: [],
  selectedPackageId: "",
}

export function CourseProgressCalendar({
  courses,
  events,
  medicineNameById,
  medicinePackagesById,
  onMarkDose,
}: CourseProgressCalendarProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id ?? "")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingEventId, setPendingEventId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [packageSelection, setPackageSelection] =
    useState<PackageSelectionState>(emptyPackageSelectionState)

  const selectedCourse = useMemo(() => {
    if (!courses.length) return null
    return courses.find((course) => course.id === selectedCourseId) ?? courses[0]
  }, [courses, selectedCourseId])

  const courseEvents = useMemo(() => {
    if (!selectedCourse) return []
    return events
      .filter((event) => event.courseId === selectedCourse.id)
      .sort((a, b) => a.start.localeCompare(b.start))
  }, [events, selectedCourse])

  const courseDays = useMemo(() => {
    const map = new Map<string, Date>()
    for (const event of courseEvents) {
      const date = new Date(event.start)
      if (Number.isNaN(date.getTime())) continue
      const key = dateKey(date)
      if (!map.has(key)) map.set(key, startOfDay(date))
    }
    return Array.from(map.values()).sort((a, b) => a.getTime() - b.getTime())
  }, [courseEvents])

  const selectedDay = useMemo(() => {
    if (!selectedDate) return null
    return startOfDay(selectedDate)
  }, [selectedDate])

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return []
    return courseEvents.filter((event) => isSameDay(new Date(event.start), selectedDay))
  }, [courseEvents, selectedDay])

  const takenCount = courseEvents.filter((event) => event.status === "taken").length
  const missedCount = courseEvents.filter((event) => event.status === "missed").length
  const skippedCount = courseEvents.filter((event) => event.status === "skipped").length
  const completedCount = takenCount + missedCount + skippedCount
  const progressPercent =
    courseEvents.length > 0 ? Math.round((takenCount / courseEvents.length) * 100) : 0

  const availablePackagesByMedicineId = useMemo(() => {
    const entries = Object.entries(medicinePackagesById).map(([medicineId, packages]) => {
      const filtered = packages
        .filter((pack) => pack.tabletsInPack > 0 && !isPackageExpired(pack.expiresAt))
        .sort((a, b) => {
          const aExpiry = new Date(a.expiresAt).getTime()
          const bExpiry = new Date(b.expiresAt).getTime()
          if (Number.isNaN(aExpiry) && Number.isNaN(bExpiry)) return 0
          if (Number.isNaN(aExpiry)) return 1
          if (Number.isNaN(bExpiry)) return -1
          if (aExpiry !== bExpiry) return aExpiry - bExpiry
          return Number(a.id) - Number(b.id)
        })

      return [medicineId, filtered]
    })

    return Object.fromEntries(entries)
  }, [medicinePackagesById])

  const submitDoseUpdate = async (
    event: CourseCalendarEvent,
    state: UpsertCourseDoseLogPayload["state"],
    packageId?: number
  ): Promise<boolean> => {
    if (event.status === state) {
      const message = `Доза о ${event.doseTime} вже має статус «${toStatusLabel(state)}».`
      setStatusMessage(message)
      toast.info(message)
      return false
    }

    setIsSubmitting(true)
    setPendingEventId(event.id)

    try {
      const result = await onMarkDose(event.courseId, {
        date: dateKey(new Date(event.start)),
        time: event.doseTime,
        state,
        packageId,
      })

      const message = buildResultMessage(event, result)
      setStatusMessage(message)
      toast.success(message)
      return true
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Не вдалося оновити статус дози."
      setStatusMessage(message)
      toast.error(message)
      return false
    } finally {
      setIsSubmitting(false)
      setPendingEventId(null)
    }
  }

  const handleMarkDoseClick = (
    event: CourseCalendarEvent,
    state: UpsertCourseDoseLogPayload["state"]
  ) => {
    if (isSubmitting) return

    if (state !== "taken") {
      void submitDoseUpdate(event, state)
      return
    }

    const candidates = availablePackagesByMedicineId[event.medicineId] ?? []
    if (candidates.length === 0) {
      const message = "Немає доступних упаковок для списання таблетки."
      setStatusMessage(message)
      toast.error(message)
      return
    }

    if (candidates.length === 1) {
      const packageId = Number(candidates[0]?.id)
      if (!Number.isInteger(packageId) || packageId <= 0) {
        const message = "Некоректний ID упаковки для списання таблетки."
        setStatusMessage(message)
        toast.error(message)
        return
      }

      void submitDoseUpdate(event, "taken", packageId)
      return
    }

    setPackageSelection({
      open: true,
      event,
      candidates,
      selectedPackageId: candidates[0]?.id ?? "",
    })
  }

  const handleConfirmPackageSelection = async () => {
    if (!packageSelection.event) return

    const parsedPackageId = Number(packageSelection.selectedPackageId)
    if (!Number.isInteger(parsedPackageId) || parsedPackageId <= 0) {
      const message = "Обери коректну упаковку для списання таблетки."
      setStatusMessage(message)
      toast.error(message)
      return
    }

    const ok = await submitDoseUpdate(packageSelection.event, "taken", parsedPackageId)
    if (ok) {
      setPackageSelection(emptyPackageSelectionState)
    }
  }

  if (!selectedCourse) {
    return (
      <Empty className="rounded-xl border border-border/70 bg-card/80 p-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarCheck2 className="size-5" />
          </EmptyMedia>
          <EmptyTitle className="text-base">Немає курсів</EmptyTitle>
          <EmptyDescription>Додай курс, щоб побачити календар прогресу.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedCourse.id} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-full sm:w-[360px]">
                <SelectValue placeholder="Обери курс" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {medicineNameById[course.medicineId] ?? "Невідомий препарат"} • {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Badge variant="outline">Виконано: {completedCount}/{courseEvents.length}</Badge>
            <Badge variant="outline">Прийнято: {takenCount}</Badge>
            <Badge variant="outline">Прогрес: {progressPercent}%</Badge>
          </div>

          <div className="w-full max-w-md space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Виконання курсу</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress
              value={progressPercent}
              aria-label={`Прогрес курсу ${progressPercent}%`}
            />
          </div>

          {statusMessage ? (
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          ) : null}
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[max-content_minmax(320px,1fr)]">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasEvent: courseDays,
              hasTaken: courseEvents
                .filter((event) => event.status === "taken")
                .map((event) => new Date(event.start)),
              hasMissed: courseEvents
                .filter((event) => event.status === "missed")
                .map((event) => new Date(event.start)),
            }}
            modifiersClassNames={{
              hasEvent:
                "data-[selected=false]:bg-primary/15 data-[selected=false]:text-foreground/90",
              hasTaken:
                "data-[selected=false]:bg-emerald-500/20 data-[selected=false]:text-emerald-950",
              hasMissed:
                "data-[selected=false]:bg-rose-500/20 data-[selected=false]:text-rose-950",
            }}
            captionLayout="dropdown"
            className="w-fit max-w-full rounded-xl border border-border/70 bg-card/80 p-2 sm:p-3"
          />

          <div className="min-h-[260px] rounded-xl border border-border/70 bg-card/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarCheck2 className="size-4 text-primary" />
              <p className="text-sm font-medium">
                {selectedDay ? formatDate(selectedDay) : "Обери день у курсі"}
              </p>
            </div>

            <div className="mb-4 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Препарат:</span>{" "}
                {medicineNameById[selectedCourse.medicineId] ?? "Невідомо"}
              </p>
              <p>
                <span className="text-muted-foreground">Курс:</span> {selectedCourse.title}
              </p>
              <p>
                <span className="text-muted-foreground">Пропущено:</span> {missedCount} •{" "}
                <span className="text-muted-foreground">Пропущено навмисно:</span> {skippedCount}
              </p>
            </div>

            {selectedDayEvents.length === 0 ? (
              <Empty className="gap-2 rounded-lg border border-dashed p-4">
                <EmptyHeader className="gap-1">
                  <EmptyTitle className="text-sm">На цей день подій немає</EmptyTitle>
                  <EmptyDescription>Обери іншу дату в календарі.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => {
                  const isEventPending = isSubmitting && pendingEventId === event.id

                  return (
                    <div key={event.id} className="rounded-lg border border-border/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{event.doseTime}</p>
                        <Badge variant="outline">{toStatusLabel(event.status)}</Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={event.status === "taken" ? "default" : "outline"}
                          disabled={isSubmitting}
                          onClick={() => handleMarkDoseClick(event, "taken")}
                        >
                          <CheckCircle2 className="size-4" />
                          {event.status === "taken" ? "Прийнято ✓" : "Прийнято"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={event.status === "missed" ? "destructive" : "outline"}
                          disabled={isSubmitting}
                          onClick={() => handleMarkDoseClick(event, "missed")}
                        >
                          <CircleAlert className="size-4" />
                          {event.status === "missed" ? "Пропущено ✓" : "Пропущено"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={event.status === "skipped" ? "secondary" : "outline"}
                          disabled={isSubmitting}
                          onClick={() => handleMarkDoseClick(event, "skipped")}
                        >
                          <SkipForward className="size-4" />
                          {event.status === "skipped" ? "Скасовано ✓" : "Скасовано"}
                        </Button>
                      </div>

                      {isEventPending ? (
                        <p className="mt-2 text-xs text-muted-foreground">Зберігаємо зміни...</p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={packageSelection.open}
        onOpenChange={(open) => {
          if (!open) {
            setPackageSelection(emptyPackageSelectionState)
            return
          }
          setPackageSelection((current) => ({ ...current, open }))
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Оберіть упаковку для списання</DialogTitle>
            <DialogDescription>
              Для цього препарату знайдено кілька доступних упаковок. Обери одну для списання
              1 таблетки.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {packageSelection.candidates.map((pack) => (
              <label key={pack.id} className="flex cursor-pointer items-start gap-2 rounded-lg border p-3">
                <input
                  type="radio"
                  name="dose-package"
                  value={pack.id}
                  checked={packageSelection.selectedPackageId === pack.id}
                  onChange={() =>
                    setPackageSelection((current) => ({
                      ...current,
                      selectedPackageId: pack.id,
                    }))
                  }
                  className="mt-1 size-4 accent-primary"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Упаковка #{pack.id}</p>
                  <p className="text-xs text-muted-foreground">
                    Залишок: {pack.tabletsInPack} табл. • Термін: {formatDate(pack.expiresAt)}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPackageSelection(emptyPackageSelectionState)}
              disabled={isSubmitting}
            >
              Скасувати
            </Button>
            <Button type="button" onClick={handleConfirmPackageSelection} disabled={isSubmitting}>
              Підтвердити списання
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
