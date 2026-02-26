"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { MedicineBentoGrid } from "@/components/dashboard/medicine-bento-grid"
import { useDebouncedValue } from "@/components/medicines/hooks/use-debounced-value"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getMedicines } from "@/lib/client-api/medicines"
import { isExpiringSoon, isLowStock } from "@/lib/medicine"
import type { MedicineDashboardItem } from "@/types/medicine"

type SortKey = "name-asc" | "name-desc" | "stock-asc" | "expiry"
type BackendSort = "name_asc" | "name_desc" | "count_asc" | "date_asc"
type ExpiredFilter = "all" | "expired"

function mapSortKeyToBackendSort(value: SortKey): BackendSort {
  if (value === "name-asc") return "name_asc"
  if (value === "name-desc") return "name_desc"
  if (value === "stock-asc") return "count_asc"
  return "date_asc"
}

interface MedicineInventoryPanelProps {
  medicines: MedicineDashboardItem[]
}

export function MedicineInventoryPanel({ medicines }: MedicineInventoryPanelProps) {
  const [query, setQuery] = useState("")
  const [effectQuery, setEffectQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("name-asc")
  const [expiredFilter, setExpiredFilter] = useState<ExpiredFilter>("all")
  const debouncedQuery = useDebouncedValue(query.trim(), 350)
  const debouncedEffectQuery = useDebouncedValue(effectQuery.trim(), 350)

  const medicinesQuery = useQuery<MedicineDashboardItem[]>({
    queryKey: [
      "dashboard-medicines",
      debouncedQuery,
      debouncedEffectQuery,
      sort,
      expiredFilter,
    ],
    queryFn: ({ signal }) =>
      getMedicines({
        search: debouncedQuery || undefined,
        effect: debouncedEffectQuery || undefined,
        sort: mapSortKeyToBackendSort(sort),
        showExpired: expiredFilter === "expired",
      }, { signal }),
    placeholderData: (previousData) => previousData ?? medicines,
    initialData: medicines,
    staleTime: 30_000,
    retry: 1,
  })

  const items = medicinesQuery.data ?? medicines
  const lowStockCount = useMemo(() => items.filter(isLowStock).length, [items])
  const expiringSoonCount = useMemo(() => items.filter(isExpiringSoon).length, [items])

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-card/95 dark:bg-card">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук ліків..."
            className="border-border/70 md:max-w-sm dark:bg-input/40"
          />
          <Input
            value={effectQuery}
            onChange={(event) => setEffectQuery(event.target.value)}
            placeholder="Фільтр за ефектом..."
            className="border-border/70 md:max-w-sm dark:bg-input/40"
          />

          <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <SelectTrigger className="w-full border-border/70 md:w-56 dark:bg-input/40">
              <SelectValue placeholder="Сортування" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">За назвою (А-Я)</SelectItem>
              <SelectItem value="name-desc">За назвою (Я-А)</SelectItem>
              <SelectItem value="stock-asc">Залишок: від меншого</SelectItem>
              <SelectItem value="expiry">За найближчим терміном</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={expiredFilter}
            onValueChange={(value) => setExpiredFilter(value as ExpiredFilter)}
          >
            <SelectTrigger className="w-full border-border/70 md:w-52 dark:bg-input/40">
              <SelectValue placeholder="Фільтр терміну" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Усі</SelectItem>
              <SelectItem value="expired">Тільки прострочені</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Усього: {items.length}</Badge>
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-800 dark:border-amber-500/40 dark:text-amber-200"
        >
          Закінчуються: {lowStockCount}
        </Badge>
        <Badge
          variant="outline"
          className="border-orange-300 text-orange-800 dark:border-orange-500/40 dark:text-orange-200"
        >
          Скоро термін: {expiringSoonCount}
        </Badge>
        {medicinesQuery.isFetching ? <Badge variant="outline">Оновлення...</Badge> : null}
        {medicinesQuery.error ? (
          <Badge variant="destructive">Не вдалося оновити фільтр</Badge>
        ) : null}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Нічого не знайдено за поточними фільтрами.
          </CardContent>
        </Card>
      ) : (
        <MedicineBentoGrid medicines={items} />
      )}
    </div>
  )
}
