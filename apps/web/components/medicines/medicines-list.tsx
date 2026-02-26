"use client"

import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

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
import { useDebouncedValue } from "@/components/medicines/hooks/use-debounced-value"
import { getMedicines } from "@/lib/client-api/medicines"
import { formatDate } from "@/lib/date"
import type { MedicineDashboardItem } from "@/types/medicine"

interface MedicinesListProps {
  medicines: MedicineDashboardItem[]
}

type SortKey = "name-asc" | "name-desc" | "stock-asc" | "expiry"
type BackendSort = "name_asc" | "name_desc" | "count_asc" | "date_asc"

function mapSortKeyToBackendSort(value: SortKey): BackendSort {
  if (value === "name-asc") return "name_asc"
  if (value === "name-desc") return "name_desc"
  if (value === "stock-asc") return "count_asc"
  return "date_asc"
}

export function MedicinesList({ medicines }: MedicinesListProps) {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("name-asc")
  const debouncedQuery = useDebouncedValue(query.trim(), 350)
  const backendSort = mapSortKeyToBackendSort(sort)

  const medicinesQuery = useQuery<MedicineDashboardItem[]>({
    queryKey: ["medicines-list", debouncedQuery, backendSort],
    queryFn: ({ signal }) =>
      getMedicines({
        search: debouncedQuery || undefined,
        sort: backendSort,
      }, { signal }),
    placeholderData: medicines,
    staleTime: 30_000,
    retry: 1,
  })

  const filtered = medicinesQuery.data ?? medicines

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
              <SelectItem value="name-asc">За назвою (А-Я)</SelectItem>
              <SelectItem value="name-desc">За назвою (Я-А)</SelectItem>
              <SelectItem value="stock-asc">Залишок: від меншого</SelectItem>
              <SelectItem value="expiry">За найближчим терміном</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Усього: {medicines.length}</Badge>
          <Badge variant="outline">Після фільтра: {filtered.length}</Badge>
          {medicinesQuery.isFetching ? (
            <Badge variant="outline">Оновлення...</Badge>
          ) : null}
          {medicinesQuery.error ? (
            <Badge variant="destructive">Помилка пошуку</Badge>
          ) : null}
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
