"use client"

import { useEffect, useMemo, useState } from "react"
import { eachDayOfInterval, endOfDay, formatISO, isSameDay, startOfDay } from "date-fns"
import { CalendarCheck2, CheckCircle2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/date"
import type { MedicineCourse } from "@/types/medicine"

const PROGRESS_STORAGE_KEY = "course_progress_v1"

type ProgressStore = Record<string, Record<string, boolean>>

interface CourseProgressCalendarProps {
  courses: MedicineCourse[]
  medicineNameById: Record<string, string>
}

function dateKey(date: Date): string {
  return formatISO(startOfDay(date), { representation: "date" })
}

function getCourseDays(course: MedicineCourse): Date[] {
  const start = startOfDay(new Date(course.periodStart))
  const end = endOfDay(new Date(course.periodEnd))
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
  if (start > end) return []
  return eachDayOfInterval({ start, end })
}

export function CourseProgressCalendar({
  courses,
  medicineNameById,
}: CourseProgressCalendarProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id ?? "")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [progressStore, setProgressStore] = useState<ProgressStore>(() => {
    if (typeof window === "undefined") return {}
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw) as ProgressStore
      return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressStore))
    } catch {
      // no-op when storage is unavailable
    }
  }, [progressStore])

  const selectedCourse = useMemo(() => {
    if (!courses.length) return null
    return courses.find((course) => course.id === selectedCourseId) ?? courses[0]
  }, [courses, selectedCourseId])

  const courseDays = useMemo(
    () => (selectedCourse ? getCourseDays(selectedCourse) : []),
    [selectedCourse]
  )

  const today = startOfDay(new Date())
  const firstCourseDay = courseDays[0]
  const lastCourseDay = courseDays[courseDays.length - 1]
  const isTodayInCourse =
    !!firstCourseDay &&
    !!lastCourseDay &&
    today.getTime() >= firstCourseDay.getTime() &&
    today.getTime() <= lastCourseDay.getTime()

  const selectedDateInRange =
    !!selectedDate && courseDays.some((day) => isSameDay(day, selectedDate))

  const selectedDay = selectedDateInRange ? startOfDay(selectedDate as Date) : null
  const activeDay = selectedDay ?? (isTodayInCourse ? today : firstCourseDay ?? null)

  const doneForCourse = progressStore[selectedCourse?.id ?? ""] ?? {}
  const doneDays = courseDays.filter((day) => doneForCourse[dateKey(day)])
  const progressPercent =
    courseDays.length > 0 ? Math.round((doneDays.length / courseDays.length) * 100) : 0

  const toggleDay = (day: Date | null) => {
    if (!selectedCourse || !day) return
    const key = dateKey(day)
    setProgressStore((prev) => {
      const courseProgress = { ...(prev[selectedCourse.id] ?? {}) }
      if (courseProgress[key]) {
        delete courseProgress[key]
      } else {
        courseProgress[key] = true
      }
      return { ...prev, [selectedCourse.id]: courseProgress }
    })
  }

  if (!selectedCourse) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/80 p-4 text-sm text-muted-foreground">
        Немає курсів для відображення календаря.
      </div>
    )
  }

  return (
    <div className="space-y-4">
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

        <Badge variant="outline">Прогрес: {doneDays.length}/{courseDays.length}</Badge>
        <Badge variant="outline">{progressPercent}%</Badge>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[max-content_minmax(280px,1fr)]">
        <Calendar
          mode="range"
          selected={{
            from: firstCourseDay,
            to: lastCourseDay,
          }}
          onDayClick={(day) => {
            setSelectedDate(day)
            if (courseDays.some((courseDay) => isSameDay(courseDay, day))) {
              toggleDay(day)
            }
          }}
          modifiers={{
            done: doneDays,
            inCourse: courseDays,
            current: activeDay ? [activeDay] : [],
          }}
          modifiersClassNames={{
            done:
              "bg-primary! text-primary-foreground! data-[selected=true]:bg-primary! data-[selected=true]:text-primary-foreground!",
            inCourse:
              "data-[selected=false]:bg-primary/18 data-[selected=false]:text-foreground/90",
            current:
              "ring-2 ring-primary/80 ring-offset-2 ring-offset-background data-[selected=false]:bg-primary/25",
          }}
          captionLayout="dropdown"
          className="w-fit max-w-full rounded-xl border border-border/70 bg-card/80 p-2 sm:p-3"
        />

        <div className="min-h-[240px] rounded-xl border border-border/70 bg-card/80 p-4">
          <div className="mb-3 flex items-center gap-2">
            <CalendarCheck2 className="size-4 text-primary" />
            <p className="text-sm font-medium">
              {activeDay ? formatDate(activeDay) : "Обери день у курсі"}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Препарат:</span>{" "}
              {medicineNameById[selectedCourse.medicineId] ?? "Невідомо"}
            </p>
            <p>
              <span className="text-muted-foreground">Курс:</span> {selectedCourse.title}
            </p>
            <p>
              <span className="text-muted-foreground">Період:</span>{" "}
              {formatDate(selectedCourse.periodStart)} - {formatDate(selectedCourse.periodEnd)}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <Button
              type="button"
              className="w-full"
              disabled={!activeDay}
              onClick={() => toggleDay(activeDay)}
            >
              <CheckCircle2 className="size-4" />
              {activeDay && doneForCourse[dateKey(activeDay)]
                ? "Скасувати відмітку"
                : "Відмітити як випито"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!today || !courseDays.some((day) => isSameDay(day, today))}
              onClick={() => {
                setSelectedDate(today)
                toggleDay(today)
              }}
            >
              Відмітити сьогодні
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
