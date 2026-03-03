"use client"

import { type FormEvent, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { CreateMedicineCoursePayload } from "@/lib/client-api/medicines"
import type { MedicineDashboardItem } from "@/types/medicine"

interface CreateCourseFormProps {
  medicines: MedicineDashboardItem[]
  onCreateCourse: (payload: CreateMedicineCoursePayload) => Promise<void>
}

function toTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CreateCourseForm({ medicines, onCreateCourse }: CreateCourseFormProps) {
  const [isPending, startTransition] = useTransition()
  const [tabletoId, setTabletoId] = useState(medicines[0]?.id ?? "")
  const [nameDoctor, setNameDoctor] = useState("")
  const [period, setPeriod] = useState("14")
  const [qtyDay, setQtyDay] = useState("2")
  const [startDate, setStartDate] = useState(toTodayIsoDate)
  const [description, setDescription] = useState("")

  const canSubmit = useMemo(() => {
    return (
      !isPending &&
      Boolean(tabletoId) &&
      nameDoctor.trim().length > 0 &&
      Number(period) > 0 &&
      Number(qtyDay) > 0 &&
      Boolean(startDate)
    )
  }, [isPending, nameDoctor, period, qtyDay, startDate, tabletoId])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const parsedTabletoId = Number(tabletoId)
    const parsedPeriod = Number(period)
    const parsedQtyDay = Number(qtyDay)

    if (
      !Number.isInteger(parsedTabletoId) ||
      parsedTabletoId <= 0 ||
      !Number.isInteger(parsedPeriod) ||
      parsedPeriod <= 0 ||
      !Number.isInteger(parsedQtyDay) ||
      parsedQtyDay <= 0
    ) {
      toast.error("Перевір правильність числових полів курсу.")
      return
    }

    startTransition(async () => {
      try {
        await onCreateCourse({
          tabletoId: parsedTabletoId,
          nameDoctor: nameDoctor.trim(),
          period: parsedPeriod,
          qtyDay: parsedQtyDay,
          startDate,
          description: description.trim() || undefined,
        })

        toast.success("Курс створено.")
        setNameDoctor("")
        setPeriod("14")
        setQtyDay("2")
        setStartDate(toTodayIsoDate())
        setDescription("")
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : "Не вдалося створити курс."
        toast.error(message)
      }
    })
  }

  if (medicines.length === 0) {
    return (
      <Card className="border-border/70 bg-card/95 dark:bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Створення курсу</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Спочатку додай хоча б один препарат, щоб створити курс.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/70 bg-card/95 dark:bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Новий курс у календарі</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="course-medicine">Препарат</Label>
            <Select value={tabletoId} onValueChange={setTabletoId}>
              <SelectTrigger id="course-medicine">
                <SelectValue placeholder="Обери препарат" />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((medicine) => (
                  <SelectItem key={medicine.id} value={medicine.id}>
                    {medicine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="course-doctor">Лікар / джерело призначення</Label>
            <Input
              id="course-doctor"
              value={nameDoctor}
              onChange={(event) => setNameDoctor(event.target.value)}
              placeholder="Напр. Кардіолог Іваненко"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="course-start-date">Дата початку</Label>
            <Input
              id="course-start-date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="course-period">Тривалість (днів)</Label>
            <Input
              id="course-period"
              type="number"
              min={1}
              step={1}
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="course-qty-day">Прийомів на день</Label>
            <Input
              id="course-qty-day"
              type="number"
              min={1}
              step={1}
              value={qtyDay}
              onChange={(event) => setQtyDay(event.target.value)}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="course-description">Опис (необовʼязково)</Label>
            <Input
              id="course-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Напр. Після їжі, запивати водою"
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? "Створення..." : "Створити курс"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
