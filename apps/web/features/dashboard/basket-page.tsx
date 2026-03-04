import Link from "next/link"

import { BasketInteractive, type BasketPackageItem } from "@/components/dashboard/basket-interactive"
import { PageShell } from "@/components/dashboard/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMedicines } from "@/lib/client-api/medicines"

function toBasketItems(medicines: Awaited<ReturnType<typeof getMedicines>>): BasketPackageItem[] {
  const now = Date.now()

  const items = medicines.flatMap((medicine) =>
    medicine.packages
      .map((pack) => {
        const expiresAtTs = new Date(pack.expiresAt).getTime()
        const isExpired = Number.isFinite(expiresAtTs) ? expiresAtTs < now : false
        const isEmpty = pack.tabletsInPack <= 0
        return {
          packageId: pack.id,
          medicineId: medicine.id,
          medicineName: medicine.name,
          tabletsInPack: pack.tabletsInPack,
          expiresAt: pack.expiresAt,
          isEmpty,
          isExpired,
        } satisfies BasketPackageItem
      })
      .filter((item) => item.isEmpty || item.isExpired)
  )

  return items.sort((a, b) => {
    if (a.isExpired !== b.isExpired) return a.isExpired ? -1 : 1
    if (a.isEmpty !== b.isEmpty) return a.isEmpty ? -1 : 1
    const aExpires = new Date(a.expiresAt).getTime()
    const bExpires = new Date(b.expiresAt).getTime()
    if (Number.isFinite(aExpires) && Number.isFinite(bExpires)) {
      return aExpires - bExpires
    }
    return a.medicineName.localeCompare(b.medicineName, "uk")
  })
}

export async function BasketPage() {
  let errorMessage: string | null = null
  let basketItems: BasketPackageItem[] = []

  try {
    const medicines = await getMedicines()
    basketItems = toBasketItems(medicines)
  } catch {
    errorMessage = "Не вдалося завантажити корзину. Спробуй оновити сторінку."
  }

  return (
    <PageShell
      title="Корзина аптечки"
      description="Тут зібрані упаковки з нульовим залишком або простроченим терміном придатності."
    >
      {errorMessage ? (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">Помилка завантаження</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {errorMessage}
            <div className="mt-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/basket">Оновити сторінку</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <BasketInteractive initialItems={basketItems} />
      )}
    </PageShell>
  )
}
