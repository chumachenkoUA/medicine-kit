"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, Minus, Package2, Pill, Plus } from "lucide-react"
import { toast } from "sonner"

import { useDebouncedValue } from "@/components/medicines/hooks/use-debounced-value"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/date"
import { getMedicines, updateMedicinePackage } from "@/lib/client-api/medicines"
import { getStockPercent, isExpiringSoon } from "@/lib/medicine"
import type { MedicineDashboardItem } from "@/types/medicine"

type SortKey = "name-asc" | "name-desc" | "stock-asc" | "expiry"
type ExpiredFilter = "all" | "expired"

interface PackageCardItem {
  packageId: string
  medicineId: string
  medicineName: string
  imageUrl?: string
  form: string
  description: string
  tabletsInPack: number
  initialTabletsInPack: number
  expiresAt: string
  stockUnit: string
}

function patchPackageCount(
  source: MedicineDashboardItem[],
  packageId: string,
  nextCount: number
): MedicineDashboardItem[] {
  return source.map((medicine) => {
    const packageIndex = medicine.packages.findIndex((pack) => pack.id === packageId)
    if (packageIndex === -1) return medicine

    const previousCount = medicine.packages[packageIndex]?.tabletsInPack ?? 0
    const delta = nextCount - previousCount

    const nextPackages = medicine.packages.map((pack) =>
      pack.id === packageId ? { ...pack, tabletsInPack: nextCount } : pack
    )

    const nextStockCount = Math.max(0, medicine.stockCount + delta)
    const nextStockCapacity = medicine.stockCapacity

    return {
      ...medicine,
      packages: nextPackages,
      stockCount: nextStockCount,
      stockCapacity: nextStockCapacity,
      stockLabel: `${nextStockCount} ${medicine.stockUnit}`,
    }
  })
}

interface MedicineInventoryPanelProps {
  medicines: MedicineDashboardItem[]
}

export function MedicineInventoryPanel({ medicines }: MedicineInventoryPanelProps) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState("")
  const [effectQuery, setEffectQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("name-asc")
  const [expiredFilter, setExpiredFilter] = useState<ExpiredFilter>("all")
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [failedImageKeys, setFailedImageKeys] = useState<Record<string, true>>({})
  const [consumeAmount, setConsumeAmount] = useState("1")
  const debouncedQuery = useDebouncedValue(query.trim(), 350)
  const debouncedEffectQuery = useDebouncedValue(effectQuery.trim(), 350)

  const queryKey = [
    "dashboard-medicines",
    debouncedQuery,
    debouncedEffectQuery,
    sort,
    expiredFilter,
  ] as const

  const medicinesQuery = useQuery<MedicineDashboardItem[]>({
    queryKey,
    queryFn: ({ signal }) =>
      getMedicines(
        {
          search: debouncedQuery || undefined,
          effect: debouncedEffectQuery || undefined,
          showExpired: expiredFilter === "expired",
        },
        { signal }
      ),
    placeholderData: (previousData) => previousData ?? medicines,
    initialData: medicines,
    staleTime: 30_000,
    retry: 1,
  })

  const updatePackageMutation = useMutation({
    mutationFn: ({ packageId, nextCount }: { packageId: string; nextCount: number }) =>
      updateMedicinePackage(packageId, { count: nextCount }),
    onMutate: async ({ packageId, nextCount }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<MedicineDashboardItem[]>(queryKey)

      queryClient.setQueryData<MedicineDashboardItem[]>(queryKey, (current) => {
        const source = current ?? medicines
        return patchPackageCount(source, packageId, nextCount)
      })

      return { previous }
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Не вдалося списати таблетки з упаковки."
      toast.error(message)
    },
    onSuccess: () => {
      toast.success("Прийом зафіксовано.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const items = medicinesQuery.data ?? medicines
  const packageItems = useMemo<PackageCardItem[]>(
    () =>
      items.flatMap((medicine) =>
        medicine.packages.map((pack) => ({
          packageId: pack.id,
          medicineId: medicine.id,
          medicineName: medicine.name,
          imageUrl: medicine.imageUrl,
          form: medicine.form,
          description: medicine.description,
          tabletsInPack: pack.tabletsInPack,
          initialTabletsInPack: Math.max(
            pack.initialTabletsInPack ?? pack.tabletsInPack,
            1
          ),
          expiresAt: pack.expiresAt,
          stockUnit: medicine.stockUnit,
        }))
      ),
    [items]
  )

  const selectedPackage = useMemo(
    () => packageItems.find((pack) => pack.packageId === selectedPackageId) ?? null,
    [packageItems, selectedPackageId]
  )

  const visiblePackageItems = useMemo(() => {
    const normalizedQuery = debouncedQuery.toLowerCase()
    const normalizedEffect = debouncedEffectQuery.toLowerCase()

    const filtered = packageItems.filter((pack) => {
      const searchable = `${pack.medicineName} ${pack.form} ${pack.description}`.toLowerCase()
      if (normalizedQuery && !searchable.includes(normalizedQuery)) return false
      if (normalizedEffect && !searchable.includes(normalizedEffect)) return false
      if (expiredFilter === "expired" && !isExpiringSoon({ nearestExpiryAt: pack.expiresAt }, 0)) {
        return false
      }
      return true
    })

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sort === "name-asc") return a.medicineName.localeCompare(b.medicineName, "uk")
      if (sort === "name-desc") return b.medicineName.localeCompare(a.medicineName, "uk")
      if (sort === "stock-asc") return a.tabletsInPack - b.tabletsInPack

      const aExpiry = new Date(a.expiresAt).getTime()
      const bExpiry = new Date(b.expiresAt).getTime()
      if (Number.isNaN(aExpiry) && Number.isNaN(bExpiry)) return 0
      if (Number.isNaN(aExpiry)) return 1
      if (Number.isNaN(bExpiry)) return -1
      return aExpiry - bExpiry
    })

    return sorted
  }, [debouncedEffectQuery, debouncedQuery, expiredFilter, packageItems, sort])

  const lowStockCount = useMemo(
    () => visiblePackageItems.filter((pack) => pack.tabletsInPack <= 10).length,
    [visiblePackageItems]
  )
  const expiringSoonCount = useMemo(
    () =>
      visiblePackageItems.filter((pack) =>
        isExpiringSoon({ nearestExpiryAt: pack.expiresAt })
      ).length,
    [visiblePackageItems]
  )

  const handleOpenPackage = (packageId: string) => {
    setSelectedPackageId(packageId)
    setIsImagePreviewOpen(false)
    setConsumeAmount("1")
  }

  const markImageAsFailed = (key: string) => {
    setFailedImageKeys((current) => {
      if (current[key]) return current
      return { ...current, [key]: true }
    })
  }

  const handleConsume = (amount: number) => {
    if (!selectedPackage) return
    if (!Number.isInteger(amount) || amount <= 0) return

    const nextCount = selectedPackage.tabletsInPack - amount
    if (nextCount < 0) {
      toast.error("У пачці недостатньо таблеток для цієї дії.")
      return
    }

    updatePackageMutation.mutate({
      packageId: selectedPackage.packageId,
      nextCount,
    })
  }

  const normalizeConsumeAmount = () => {
    const parsed = Number(consumeAmount)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setConsumeAmount("1")
      return
    }
    setConsumeAmount(String(parsed))
  }

  const stepConsumeAmount = (delta: number) => {
    const parsed = Number(consumeAmount)
    const base = Number.isInteger(parsed) && parsed > 0 ? parsed : 1
    const next = Math.max(1, base + delta)
    setConsumeAmount(String(next))
  }

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
        <Badge variant="outline">Усього упаковок: {visiblePackageItems.length}</Badge>
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-800 dark:border-amber-500/40 dark:text-amber-200"
        >
          Мало в пачці: {lowStockCount}
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

      {visiblePackageItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Нічого не знайдено за поточними фільтрами.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiblePackageItems.map((pack, index) => {
            const expiringSoon = isExpiringSoon({ nearestExpiryAt: pack.expiresAt })
            const isExpired = isExpiringSoon({ nearestExpiryAt: pack.expiresAt }, 0)
            const stockPercent = getStockPercent({
              stockCount: pack.tabletsInPack,
              stockCapacity: pack.initialTabletsInPack,
            })
            const progressTone =
              pack.tabletsInPack === 0
                ? "bg-red-500 dark:bg-red-400"
                : pack.tabletsInPack <= 10
                ? "bg-amber-500 dark:bg-amber-400"
                : expiringSoon
                  ? "bg-orange-500 dark:bg-orange-400"
                  : "bg-primary"

            return (
              <Card
                key={pack.packageId}
                className="dashboard-reveal group cursor-pointer border-border/70 bg-card/95 transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg dark:bg-card"
                style={{ animationDelay: `${40 * (index + 1)}ms` }}
                onClick={() => handleOpenPackage(pack.packageId)}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-muted/40">
                      {pack.imageUrl && !failedImageKeys[`card:${pack.packageId}`] ? (
                        <Image
                          src={pack.imageUrl}
                          alt={pack.medicineName}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-cover"
                          onError={() => markImageAsFailed(`card:${pack.packageId}`)}
                        />
                      ) : (
                        <Pill className="size-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="line-clamp-2 text-base font-semibold">{pack.medicineName}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{pack.form}</p>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{pack.description}</p>

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Package2 className="size-4" />
                      У пачці: {pack.tabletsInPack} {pack.stockUnit}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarClock className="size-4" />
                      Термін: {formatDate(pack.expiresAt)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressTone}`}
                        style={{ width: `${stockPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pack.tabletsInPack} із {pack.initialTabletsInPack} {pack.stockUnit}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {pack.tabletsInPack === 0 ? (
                      <Badge
                        variant="outline"
                        className="border-red-300 text-red-700 dark:border-red-500/40 dark:text-red-200"
                      >
                        Порожньо
                      </Badge>
                    ) : null}
                    {pack.tabletsInPack > 0 && pack.tabletsInPack <= 10 ? (
                      <Badge
                        variant="outline"
                        className="border-amber-300 text-amber-700 dark:border-amber-500/40 dark:text-amber-200"
                      >
                        Мало залишку
                      </Badge>
                    ) : null}
                    {expiringSoon ? (
                      <Badge
                        variant="outline"
                        className="border-orange-300 text-orange-700 dark:border-orange-500/40 dark:text-orange-200"
                      >
                        {isExpired ? "Прострочено" : "Скоро термін"}
                      </Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={Boolean(selectedPackage)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPackageId(null)
            setIsImagePreviewOpen(false)
          }
        }}
      >
        <DialogContent>
          {selectedPackage ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedPackage.imageUrl &&
                  !failedImageKeys[`modal:${selectedPackage.packageId}`] ? (
                    <div className="flex size-8 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-muted/40">
                      <Image
                        src={selectedPackage.imageUrl}
                        alt={selectedPackage.medicineName}
                        width={32}
                        height={32}
                        unoptimized
                        className="h-full w-full object-cover"
                        onError={() => markImageAsFailed(`modal:${selectedPackage.packageId}`)}
                      />
                    </div>
                  ) : (
                    <Pill className="size-5 text-primary" />
                  )}
                  {selectedPackage.medicineName}
                </DialogTitle>
                <DialogDescription>{selectedPackage.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <div className="relative mx-auto flex h-40 w-full max-w-xs items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted/40">
                  {selectedPackage.imageUrl &&
                  !failedImageKeys[`modal:large:${selectedPackage.packageId}`] ? (
                    <Image
                      src={selectedPackage.imageUrl}
                      alt={selectedPackage.medicineName}
                      fill
                      unoptimized
                      className="object-contain p-2"
                      onError={() => markImageAsFailed(`modal:large:${selectedPackage.packageId}`)}
                    />
                  ) : (
                    <Pill className="size-10 text-primary" />
                  )}
                </div>
                {selectedPackage.imageUrl &&
                !failedImageKeys[`modal:large:${selectedPackage.packageId}`] ? (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImagePreviewOpen(true)}
                    >
                      Збільшити фото
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Форма:</span>{" "}
                  {selectedPackage.form}
                </p>
                <p>
                  <span className="text-muted-foreground">Термін придатності:</span>{" "}
                  {formatDate(selectedPackage.expiresAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">Залишок у пачці:</span>{" "}
                  {selectedPackage.tabletsInPack} {selectedPackage.stockUnit}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[auto_auto_auto_1fr_auto] sm:items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => stepConsumeAmount(-1)}
                  disabled={Number(consumeAmount) <= 1 || updatePackageMutation.isPending}
                  aria-label="Зменшити кількість"
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="h-9 w-16 text-center"
                  value={consumeAmount}
                  onChange={(event) =>
                    setConsumeAmount(event.target.value.replace(/[^\d]/g, ""))
                  }
                  onBlur={normalizeConsumeAmount}
                  aria-label="Кількість таблеток для списання"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => stepConsumeAmount(1)}
                  disabled={updatePackageMutation.isPending}
                  aria-label="Збільшити кількість"
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleConsume(Number(consumeAmount))}
                  disabled={
                    updatePackageMutation.isPending ||
                    !Number.isInteger(Number(consumeAmount)) ||
                    Number(consumeAmount) <= 0 ||
                    selectedPackage.tabletsInPack <= 0
                  }
                >
                  Випити {Number(consumeAmount) > 0 ? Number(consumeAmount) : 1}
                </Button>
                <Button
                  onClick={() => handleConsume(1)}
                  disabled={
                    updatePackageMutation.isPending ||
                    selectedPackage.tabletsInPack <= 0
                  }
                >
                  Випити 1
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>
              Перегляд фото препарату {selectedPackage?.medicineName ?? ""}
            </DialogTitle>
            <DialogDescription>Збільшене зображення упаковки препарату.</DialogDescription>
          </DialogHeader>
          {selectedPackage?.imageUrl &&
          !failedImageKeys[`modal:large:${selectedPackage.packageId}`] ? (
            <div className="relative mx-auto h-[70vh] w-full overflow-hidden rounded-xl border border-border/70 bg-muted/40">
              <Image
                src={selectedPackage.imageUrl}
                alt={selectedPackage.medicineName}
                fill
                unoptimized
                className="object-contain p-3"
                onError={() => markImageAsFailed(`modal:large:${selectedPackage.packageId}`)}
              />
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center rounded-xl border border-border/70 bg-muted/40">
              <Pill className="size-12 text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
