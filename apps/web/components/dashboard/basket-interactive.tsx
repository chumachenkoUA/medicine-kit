"use client"

import { useMemo, useState, useTransition } from "react"
import { AlertTriangle, ArchiveX, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatDate } from "@/lib/date"
import { deleteMedicinePackage } from "@/lib/client-api/medicines"

export interface BasketPackageItem {
  packageId: string
  medicineId: string
  medicineName: string
  tabletsInPack: number
  expiresAt: string
  isEmpty: boolean
  isExpired: boolean
}

interface BasketInteractiveProps {
  initialItems: BasketPackageItem[]
}

export function BasketInteractive({ initialItems }: BasketInteractiveProps) {
  const [items, setItems] = useState(initialItems)
  const [selectedIds, setSelectedIds] = useState<Record<string, true>>({})
  const [isPending, startTransition] = useTransition()

  const selectedCount = useMemo(
    () => items.filter((item) => selectedIds[item.packageId]).length,
    [items, selectedIds]
  )

  const allSelected = items.length > 0 && selectedCount === items.length

  const toggleSelected = (packageId: string) => {
    setSelectedIds((current) => {
      const next = { ...current }
      if (next[packageId]) {
        delete next[packageId]
      } else {
        next[packageId] = true
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds({})
      return
    }

    setSelectedIds(
      Object.fromEntries(items.map((item) => [item.packageId, true])) as Record<string, true>
    )
  }

  const handleDeleteSelected = () => {
    const ids = items
      .map((item) => item.packageId)
      .filter((packageId) => selectedIds[packageId])

    if (ids.length === 0) return
    if (!window.confirm(`Видалити вибрані упаковки (${ids.length})?`)) return

    startTransition(async () => {
      const results = await Promise.allSettled(ids.map((id) => deleteMedicinePackage(id)))

      const successIds = new Set<string>()
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successIds.add(ids[index] ?? "")
        }
      })

      const deletedCount = successIds.size
      const failedCount = ids.length - deletedCount

      if (deletedCount > 0) {
        setItems((current) => current.filter((item) => !successIds.has(item.packageId)))
        setSelectedIds((current) =>
          Object.fromEntries(
            Object.entries(current).filter(([packageId]) => !successIds.has(packageId))
          ) as Record<string, true>
        )
        toast.success(`Видалено упаковок: ${deletedCount}.`)
      }

      if (failedCount > 0) {
        toast.error(`Не вдалося видалити упаковок: ${failedCount}.`)
      }
    })
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-7">
          <Empty className="gap-3 border-0 p-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ArchiveX className="size-5" />
              </EmptyMedia>
              <EmptyTitle className="text-base">Корзина порожня</EmptyTitle>
              <EmptyDescription>
                Немає упаковок із нульовим залишком або простроченим терміном.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/70 bg-card/95 dark:bg-card">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="size-4" />
            Позиції до перевірки
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggleSelectAll}
              disabled={isPending}
            >
              {allSelected ? "Зняти вибір" : "Обрати всі"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isPending || selectedCount === 0}
            >
              <Trash2 className="size-4" />
              Видалити вибрані ({selectedCount})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <label key={item.packageId} className="block rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={Boolean(selectedIds[item.packageId])}
                disabled={isPending}
                onChange={() => toggleSelected(item.packageId)}
                className="mt-1 size-4 accent-primary"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.medicineName}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.isEmpty ? <Badge variant="destructive">0 табл.</Badge> : null}
                    {item.isExpired ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        Прострочено
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Упаковка #{item.packageId}, залишок: {item.tabletsInPack} табл.
                </p>
                <p className="text-sm text-muted-foreground">
                  Термін придатності: {formatDate(item.expiresAt)}
                </p>
              </div>
            </div>
          </label>
        ))}
      </CardContent>
    </Card>
  )
}
