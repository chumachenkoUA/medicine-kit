"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UpdateMedicineCoursePayload } from "@/lib/client-api/medicines"
import type { MedicineCourse, MedicineDashboardItem } from "@/types/medicine"

interface CourseActionsProps {
  course: MedicineCourse
  medicines: MedicineDashboardItem[]
  onUpdateCourse: (courseId: string, payload: UpdateMedicineCoursePayload) => Promise<void>
  onDeleteCourse: (courseId: string) => Promise<void>
}

function toInputDate(value?: string): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

export function CourseActions({
  course,
  medicines,
  onUpdateCourse,
  onDeleteCourse,
}: CourseActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const [tabletoId, setTabletoId] = useState(course.medicineId)
  const [nameDoctor, setNameDoctor] = useState(course.doctorName)
  const [period, setPeriod] = useState(String(course.periodDays))
  const [qtyDay, setQtyDay] = useState(String(course.qtyPerDay))
  const [startDate, setStartDate] = useState(toInputDate(course.periodStart))
  const fallbackTitle = `Курс від ${course.doctorName}`
  const [description, setDescription] = useState(
    course.title === fallbackTitle ? "" : course.title
  )

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

  const handleSave = () => {
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
      toast.error("Перевір правильність числових полів.")
      return
    }

    startTransition(async () => {
      try {
        await onUpdateCourse(course.id, {
          tabletoId: parsedTabletoId,
          nameDoctor: nameDoctor.trim(),
          period: parsedPeriod,
          qtyDay: parsedQtyDay,
          startDate,
          description: description.trim() || undefined,
        })
        toast.success("Курс оновлено.")
        setOpen(false)
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : "Не вдалося оновити курс."
        toast.error(message)
      }
    })
  }

  const handleDelete = () => {
    if (!window.confirm("Видалити цей курс?")) return

    startTransition(async () => {
      try {
        await onDeleteCourse(course.id)
        toast.success("Курс видалено.")
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : "Не вдалося видалити курс."
        toast.error(message)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Редагувати
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагування курсу</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Препарат</Label>
              <Select value={tabletoId} onValueChange={setTabletoId}>
                <SelectTrigger>
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
              <Label>Лікар</Label>
              <Input
                value={nameDoctor}
                onChange={(event) => setNameDoctor(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Дата початку</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Тривалість (днів)</Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Прийомів на день</Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={qtyDay}
                onChange={(event) => setQtyDay(event.target.value)}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Опис</Label>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={!canSubmit}>
              {isPending ? "Збереження..." : "Зберегти"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Скасувати
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
        Видалити
      </Button>
    </div>
  )
}
