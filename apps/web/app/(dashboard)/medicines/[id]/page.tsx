import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Package2,
  Pill,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatDateRange } from "@/lib/date"
import {
  getMedicineById,
  getMedicineCoursesById,
} from "@/services/medicine.service"
import type { MedicineId } from "@/types/medicine"

interface MedicineDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function MedicineDetailsPage({
  params,
}: MedicineDetailsPageProps) {
  const { id } = await params
  const [medicine, courses] = await Promise.all([
    getMedicineById(id as MedicineId),
    getMedicineCoursesById(id as MedicineId),
  ])

  if (!medicine) {
    notFound()
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-6 md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            До дашборду
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Деталі препарату</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Pill className="size-5 text-primary" />
            {medicine.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{medicine.form}</Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Опис препарату</p>
            <p className="text-sm leading-relaxed">{medicine.description}</p>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Package2 className="size-4" />
                Кількість упаковок
              </p>
              <p className="text-lg font-medium">{medicine.packages.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                Активних курсів
              </p>
              <p className="text-lg font-medium">
                {courses.filter((course) => course.status === "active").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package2 className="size-5 text-primary" />
            Упаковки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {medicine.packages.map((pack, index) => (
            <div
              key={pack.id}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3"
            >
              <div>
                <p className="text-sm text-muted-foreground">Упаковка</p>
                <p className="font-medium">Упаковка {index + 1}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Таблеток у пачці</p>
                <p className="font-medium">{pack.tabletsInPack}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Термін придатності</p>
                <p className="font-medium">{formatDate(pack.expiresAt)}</p>
              </div>
              {pack.batchNumber ? (
                <div className="sm:col-span-3">
                  <p className="text-sm text-muted-foreground">Партія</p>
                  <p className="font-medium">{pack.batchNumber}</p>
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="size-5 text-primary" />
            Курси прийому
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Для цього препарату ще немає запланованих курсів.
            </p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{course.title}</p>
                  <Badge
                    variant={course.status === "active" ? "default" : "secondary"}
                  >
                    {course.status}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Дозування</p>
                    <p className="font-medium">{course.dosage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Частота</p>
                    <p className="font-medium">{course.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Часи прийому</p>
                    <p className="font-medium">{course.times.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Період</p>
                    <p className="font-medium">
                      {formatDateRange(course.periodStart, course.periodEnd)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Наступний крок: додамо форму створення курсу з розкладом та
              нагадуваннями.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
