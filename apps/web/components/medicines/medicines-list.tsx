"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/date"
import type { MedicineDashboardItem } from "@/types/medicine"

interface MedicinesListProps {
  medicines: MedicineDashboardItem[]
}

type SortKey = "name" | "stock-asc" | "stock-desc" | "expiry"

function toExpiryTime(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

export function MedicinesList({ medicines }: MedicinesListProps) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("name")

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const next = medicines.filter((item) => {
      if (!normalizedQuery) return true

      return [item.name, item.form, item.description].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    })

    next.sort((a, b) => {
      switch (sort) {
        case "stock-asc":
          return a.stockCount - b.stockCount
        case "stock-desc":
          return b.stockCount - a.stockCount
        case "expiry":
          return toExpiryTime(a.nearestExpiryAt) - toExpiryTime(b.nearestExpiryAt)
        case "name":
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return next
  }, [medicines, query, sort])

  return (
    <Card className="border-border/70 bg-card/95 dark:bg-card">
      <CardHeader className="space-y-3">
        <CardTitle>Список препаратів</CardTitle>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук за назвою, формою або описом..."
            className="border-border/70 md:max-w-sm dark:bg-input/40"
          />
          <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <SelectTrigger className="w-full border-border/70 md:ml-auto md:w-64 dark:bg-input/40">
              <SelectValue placeholder="Сортування" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">За назвою</SelectItem>
              <SelectItem value="stock-asc">Залишок: від меншого</SelectItem>
              <SelectItem value="stock-desc">Залишок: від більшого</SelectItem>
              <SelectItem value="expiry">За найближчим терміном</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Усього: {medicines.length}</Badge>
          <Badge variant="outline">Після фільтра: {filtered.length}</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Назва</TableHead>
              <TableHead>Форма</TableHead>
              <TableHead>Залишок</TableHead>
              <TableHead>Найближчий термін</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Нічого не знайдено за поточними фільтрами.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">{medicine.name}</TableCell>
                  <TableCell>{medicine.form}</TableCell>
                  <TableCell>{medicine.stockLabel}</TableCell>
                  <TableCell>
                    {medicine.nearestExpiryAt
                      ? formatDate(medicine.nearestExpiryAt)
                      : "Не вказано"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/medicines/${medicine.id}`}
                      className="text-sm font-medium text-primary underline underline-offset-4"
                    >
                      Відкрити
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
