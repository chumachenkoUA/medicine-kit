import Link from "next/link"

import { MedicinesList } from "@/components/medicines/medicines-list"
import { PageShell } from "@/components/dashboard/page-shell"
import { Button } from "@/components/ui/button"
import { getMedicines } from "@/lib/client-api/medicines"

export default async function MedicinesPage() {
  const medicines = await getMedicines()

  return (
    <PageShell
      title="Усі ліки"
      description="Повний список препаратів з фільтрами, сортуванням та швидким редагуванням."
      action={
        <Button asChild>
          <Link href="/dashboard/create-medicine">Додати ліки</Link>
        </Button>
      }
    >
      <MedicinesList medicines={medicines} />
    </PageShell>
  )
}
