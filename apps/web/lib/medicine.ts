import type { DoseStatus } from "@/types/medicine"

interface StockLike {
  stockCount: number
  stockCapacity: number
}

interface ExpiryLike {
  nearestExpiryAt?: string
}

export const doseStatusClassMap: Record<DoseStatus, string> = {
  now: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-200",
  soon: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/35 dark:bg-amber-500/15 dark:text-amber-200",
  scheduled:
    "border-border bg-muted text-muted-foreground dark:border-border/80 dark:bg-muted/60 dark:text-muted-foreground",
  missed: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/35 dark:bg-red-500/15 dark:text-red-200",
}

export function getStockPercent(item: StockLike): number {
  if (item.stockCapacity <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((item.stockCount / item.stockCapacity) * 100)))
}

export function isLowStock(item: StockLike): boolean {
  return item.stockCount <= 10 || getStockPercent(item) <= 25
}

export function isExpiringSoon(
  item: ExpiryLike,
  monthsThreshold = 1
): boolean {
  if (!item.nearestExpiryAt) return false
  const expiryTime = new Date(item.nearestExpiryAt).getTime()
  if (Number.isNaN(expiryTime)) return false

  const threshold = new Date()
  threshold.setMonth(threshold.getMonth() + monthsThreshold)
  return expiryTime < threshold.getTime()
}
