"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarClock, Clock3 } from "lucide-react"
import { toast } from "sonner"

import { CourseProgressCalendar } from "@/components/schedule/course-progress-calendar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  computeUpcomingDoses,
  computeUpcomingDosesFromCalendarEvents,
  getCourseCalendar,
  getMedicines,
  type UpsertCourseDoseLogResult,
  type UpsertCourseDoseLogPayload,
  upsertCourseDoseLog,
} from "@/lib/client-api/medicines"
import type {
  CourseCalendarEvent,
  MedicineCourse,
  MedicineDashboardItem,
} from "@/types/medicine"

function hasDateRange(course: MedicineCourse): boolean {
  if (!course.periodStart || !course.periodEnd) return false
  const start = new Date(course.periodStart)
  const end = new Date(course.periodEnd)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
  return start <= end
}

interface ScheduleInteractiveProps {
  medicines: MedicineDashboardItem[]
  initialCourses: MedicineCourse[]
}

function buildCalendarRange(): { from: string; to: string } {
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const to = new Date()
  to.setDate(to.getDate() + 60)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function ScheduleInteractive({
  medicines,
  initialCourses,
}: ScheduleInteractiveProps) {
  const courses = initialCourses
  const [medicinesState, setMedicinesState] = useState(medicines)
  const [calendarEvents, setCalendarEvents] = useState<CourseCalendarEvent[]>([])

  const loadCalendarData = useCallback(async () => {
    const range = buildCalendarRange()
    try {
      const events = await getCourseCalendar(range)
      setCalendarEvents(events)
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Не вдалося завантажити календар курсу."
      toast.error(message)
    }
  }, [])

  const loadMedicinesData = useCallback(async () => {
    try {
      const list = await getMedicines()
      setMedicinesState(list)
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Не вдалося оновити дані упаковок."
      toast.error(message)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCalendarData()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadCalendarData, courses.length])

  const fallbackUpcomingDoses = useMemo(
    () => computeUpcomingDoses(courses, medicinesState),
    [courses, medicinesState]
  )

  const upcomingDoses = useMemo(() => {
    if (calendarEvents.length > 0) {
      return computeUpcomingDosesFromCalendarEvents(calendarEvents)
    }
    return fallbackUpcomingDoses
  }, [calendarEvents, fallbackUpcomingDoses])

  const medicineNameById = useMemo(
    () => new Map(medicinesState.map((medicine) => [medicine.id, medicine.name])),
    [medicinesState]
  )
  const medicineNameRecord = useMemo(
    () => Object.fromEntries(medicineNameById.entries()),
    [medicineNameById]
  )
  const medicinePackagesById = useMemo(
    () =>
      Object.fromEntries(
        medicinesState.map((medicine) => [medicine.id, medicine.packages])
      ),
    [medicinesState]
  )

  const coursesWithDates = courses.filter(hasDateRange)
  const coursesWithoutDatesCount = courses.length - coursesWithDates.length

  const handleMarkDose = async (
    courseId: string,
    payload: UpsertCourseDoseLogPayload
  ): Promise<UpsertCourseDoseLogResult> => {
    const result = await upsertCourseDoseLog(courseId, payload)
    await Promise.all([loadCalendarData(), loadMedicinesData()])
    return result
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <Card className="border-border/70 bg-card/95 dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock3 className="size-4" />
              Найближчі прийоми
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDoses.length === 0 ? (
              <Empty className="gap-3 rounded-lg border border-dashed p-4">
                <EmptyHeader className="gap-1">
                  <EmptyMedia variant="icon">
                    <Clock3 className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle className="text-base">
                    Найближчих прийомів поки немає
                  </EmptyTitle>
                  <EmptyDescription>
                    {coursesWithoutDatesCount > 0
                      ? "Частина курсів не має дат початку/завершення в API."
                      : "Коли зʼявляться події в календарі, вони будуть тут."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
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
      </div>

      <Card className="border-border/70 bg-card/95 dark:bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="size-4" />
            Календар курсів
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <Empty className="gap-3 rounded-lg border border-dashed p-4">
              <EmptyHeader className="gap-1">
                <EmptyMedia variant="icon">
                  <CalendarClock className="size-5" />
                </EmptyMedia>
                <EmptyTitle className="text-base">Немає курсів для календаря</EmptyTitle>
                <EmptyDescription>Створи курс, щоб відслідковувати прийоми по днях.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <CourseProgressCalendar
              courses={courses}
              events={calendarEvents}
              medicineNameById={medicineNameRecord}
              medicinePackagesById={medicinePackagesById}
              onMarkDose={handleMarkDose}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
