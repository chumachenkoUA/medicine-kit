"use client"

import { memo, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CalendarClock, Package2, Pill } from "lucide-react"

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
import { getStockPercent, isExpiringSoon, isLowStock } from "@/lib/medicine"
import type { MedicineDashboardItem } from "@/types/medicine"

interface MedicineBentoGridProps {
  medicines: MedicineDashboardItem[]
}

interface MedicineCardProps {
  medicine: MedicineDashboardItem
  index: number
  onSelect: (medicineId: string) => void
}

const MedicineCard = memo(function MedicineCard({
  medicine,
  index,
  onSelect,
}: MedicineCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasLowStock = isLowStock(medicine)
  const hasExpiringRisk = isExpiringSoon(medicine)
  const imageUrl = medicine.imageUrl?.trim()
  const progressTone = hasLowStock
    ? "bg-amber-500 dark:bg-amber-400"
    : hasExpiringRisk
      ? "bg-orange-500 dark:bg-orange-400"
      : "bg-primary"
  const stockPercent = getStockPercent(medicine)

  return (
    <button
      type="button"
      onClick={() => onSelect(medicine.id)}
      className="dashboard-reveal group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-card"
      style={{ animationDelay: `${40 * (index + 1)}ms` }}
    >
      <div className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill className="size-4 text-primary" />
              <p className="line-clamp-1 text-base font-semibold">{medicine.name}</p>
            </div>
            <p className="line-clamp-1 text-xs text-muted-foreground">{medicine.form}</p>
          </div>
          {imageUrl && !imageFailed ? (
            <Image
              src={imageUrl}
              alt={medicine.name}
              width={48}
              height={48}
              unoptimized
              onError={() => setImageFailed(true)}
              className="size-12 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <Pill className="size-4 text-primary" />
          )}
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">{medicine.description}</p>

      <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Package2 className="size-4" />
          Залишок: {medicine.stockLabel}
        </p>
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressTone}`}
              style={{ width: `${stockPercent}%` }}
            />
          </div>
          <p className="text-xs">
            {medicine.stockCount}/{medicine.stockCapacity} {medicine.stockUnit}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {hasLowStock ? (
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-700 dark:border-amber-500/40 dark:text-amber-200"
            >
              Мало залишку
            </Badge>
          ) : null}
          {hasExpiringRisk ? (
            <Badge
              variant="outline"
              className="border-orange-300 text-orange-700 dark:border-orange-500/40 dark:text-orange-200"
            >
              <CalendarClock className="size-3.5" />
              Скоро термін
            </Badge>
          ) : null}
        </div>
      </div>
    </button>
  )
})

export function MedicineBentoGrid({ medicines }: MedicineBentoGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useMemo(
    () => medicines.find((medicine) => medicine.id === selectedId) ?? null,
    [medicines, selectedId]
  )
  const handleSelect = useCallback((medicineId: string) => {
    setSelectedId(medicineId)
  }, [])
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setSelectedId(null)
  }, [])

  return (
    <>
      <BentoGrid className="grid-cols-1 auto-rows-[16rem] md:grid-cols-2 xl:grid-cols-3">
        {medicines.map((medicine, index) => (
          <MedicineCard
            key={medicine.id}
            medicine={medicine}
            index={index}
            onSelect={handleSelect}
          />
        ))}
      </BentoGrid>

      <Dialog open={Boolean(selected)} onOpenChange={handleOpenChange}>
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
                    <Button variant="outline" asChild>
                      <Link href="/schedule">До розкладу</Link>
                    </Button>
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
