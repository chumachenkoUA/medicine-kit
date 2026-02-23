"use client"

import { useMemo, useState } from "react"
import { isSameDay } from "date-fns"
import { CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { formatDate } from "@/lib/date"

export interface ScheduleCalendarEvent {
  id: string
  medicineName: string
  expiresAt: string
  tabletsInPack: number
}

interface ScheduleCalendarProps {
  events: ScheduleCalendarEvent[]
}

export function ScheduleCalendar({ events }: ScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const parsedEvents = useMemo(
    () =>
      events
        .map((event) => ({ ...event, date: new Date(event.expiresAt) }))
        .filter((event) => !Number.isNaN(event.date.getTime())),
    [events]
  )

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    return parsedEvents.filter((event) => isSameDay(event.date, selectedDate))
  }, [parsedEvents, selectedDate])

  const eventDays = useMemo(() => parsedEvents.map((event) => event.date), [parsedEvents])

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[max-content_minmax(280px,1fr)]">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        captionLayout="dropdown"
        modifiers={{ hasEvent: eventDays }}
        modifiersClassNames={{
          hasEvent:
            "relative after:absolute after:bottom-1.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary/80",
        }}
        classNames={{
          day: "relative",
          day_button:
            "aria-[selected=false]:data-[has-event=true]:border-primary/45 aria-[selected=false]:data-[has-event=true]:bg-primary/10",
        }}
        className="w-fit max-w-full rounded-xl border border-border/70 bg-card/80 p-2 sm:p-3"
      />

      <div className="min-h-[220px] rounded-xl border border-border/70 bg-card/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          <p className="text-sm font-medium">
            {selectedDate ? formatDate(selectedDate) : "Обери дату"}
          </p>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">На цю дату подій не заплановано.</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-border/70 p-3">
                <p className="font-medium">{event.medicineName}</p>
                <p className="text-sm text-muted-foreground">
                  Термін придатності: {formatDate(event.expiresAt)}
                </p>
                <Badge variant="outline" className="mt-2">
                  {event.tabletsInPack} табл. в упаковці
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
