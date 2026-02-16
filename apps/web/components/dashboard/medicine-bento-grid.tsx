"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarClock, Package2, Pill } from "lucide-react"
import { isBefore, parseISO } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { BentoGrid } from "@/components/ui/bento-grid"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/date"
import type { MedicineDashboardItem } from "@/types/medicine"

interface MedicineBentoGridProps {
  medicines: MedicineDashboardItem[]
}

export function MedicineBentoGrid({ medicines }: MedicineBentoGridProps) {
  const [selected, setSelected] = useState<MedicineDashboardItem | null>(null)

  const getStockPercent = (item: MedicineDashboardItem) =>
    Math.max(0, Math.min(100, Math.round((item.stockCount / item.stockCapacity) * 100)))

  const isLowStock = (item: MedicineDashboardItem) =>
    item.stockCount <= 10 || getStockPercent(item) <= 25

  const isExpiringSoon = (item: MedicineDashboardItem) => {
    if (!item.nearestExpiryAt) return false

    const threshold = new Date()
    threshold.setMonth(threshold.getMonth() + 3)

    return isBefore(parseISO(item.nearestExpiryAt), threshold)
  }

  const getProgressTone = (item: MedicineDashboardItem) => {
    if (isLowStock(item)) return "bg-amber-500"
    if (isExpiringSoon(item)) return "bg-orange-500"
    return "bg-primary"
  }

  return (
    <>
      <BentoGrid className="grid-cols-1 auto-rows-[16rem] md:grid-cols-2 xl:grid-cols-3">
        {medicines.map((medicine, index) => {
          const hasLowStock = isLowStock(medicine)
          const hasExpiringRisk = isExpiringSoon(medicine)

          return (
            <button
              key={medicine.id}
              type="button"
              onClick={() => setSelected(medicine)}
              className="dashboard-reveal group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ animationDelay: `${40 * (index + 1)}ms` }}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

              <div className="mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Pill className="size-4 text-primary" />
                    <p className="line-clamp-1 text-base font-semibold">{medicine.name}</p>
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{medicine.form}</p>
                </div>
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">
                {medicine.description}
              </p>

              <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Package2 className="size-4" />
                  Залишок: {medicine.stockLabel}
                </p>
                <div className="space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getProgressTone(medicine)}`}
                      style={{ width: `${getStockPercent(medicine)}%` }}
                    />
                  </div>
                  <p className="text-xs">
                    {medicine.stockCount}/{medicine.stockCapacity} {medicine.stockUnit}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hasLowStock ? (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      Мало залишку
                    </Badge>
                  ) : null}
                  {hasExpiringRisk ? (
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                      <CalendarClock className="size-3.5" />
                      Скоро термін
                    </Badge>
                  ) : null}
                </div>
              </div>
            </button>
          )
        })}
      </BentoGrid>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-4xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pill className="size-5 text-primary" />
                  {selected.name}
                </DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selected.form}</Badge>
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Залишок</p>
                    <p className="font-medium">
                      {selected.stockCount}/{selected.stockCapacity} {selected.stockUnit}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild>
                      <Link href={`/medicines/${selected.id}`}>Повні деталі</Link>
                    </Button>
                    <Button variant="outline">Запланувати курс</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Упаковки</p>
                  {selected.packages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Упаковки не додані.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.packages.map((pack, index) => (
                        <div key={pack.id} className="rounded-lg border p-3 text-sm">
                          <p className="font-medium">Упаковка {index + 1}</p>
                          <p className="text-muted-foreground">
                            Таблеток у пачці: {pack.tabletsInPack}
                          </p>
                          <p className="text-muted-foreground">
                            Термін придатності: {formatDate(pack.expiresAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
