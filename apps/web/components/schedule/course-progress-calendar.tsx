"use client"

import { useMemo, useState, useTransition } from "react"
import { formatISO, isSameDay, startOfDay } from "date-fns"
import { CalendarCheck2, CheckCircle2, CircleAlert, SkipForward } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import type { UpsertCourseDoseLogPayload } from "@/lib/client-api/medicines"
import type { CourseCalendarEvent, MedicineCourse } from "@/types/medicine"

interface CourseProgressCalendarProps {
  courses: MedicineCourse[]
  events: CourseCalendarEvent[]
  medicineNameById: Record<string, string>
  onMarkDose: (courseId: string, payload: UpsertCourseDoseLogPayload) => Promise<void>
}

function dateKey(date: Date): string {
  return formatISO(startOfDay(date), { representation: "date" })
}

export function CourseProgressCalendar({
  courses,
  events,
  medicineNameById,
  onMarkDose,
}: CourseProgressCalendarProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id ?? "")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isPending, startTransition] = useTransition()

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

  const handleMarkDose = (event: CourseCalendarEvent, state: UpsertCourseDoseLogPayload["state"]) => {
    const date = dateKey(new Date(event.start))

    startTransition(async () => {
      await onMarkDose(event.courseId, {
        date,
        time: event.doseTime,
        state,
      })
    })
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
              {selectedDayEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-border/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{event.doseTime}</p>
                    <Badge variant="outline">
                      {event.status === "taken"
                        ? "Прийнято"
                        : event.status === "missed"
                          ? "Пропущено"
                          : event.status === "skipped"
                            ? "Скасовано"
                            : "Заплановано"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleMarkDose(event, "taken")}
                    >
                      <CheckCircle2 className="size-4" />
                      Прийнято
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleMarkDose(event, "missed")}
                    >
                      <CircleAlert className="size-4" />
                      Пропущено
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleMarkDose(event, "skipped")}
                    >
                      <SkipForward className="size-4" />
                      Скасовано
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
