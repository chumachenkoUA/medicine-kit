import Link from "next/link"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"
import { PageShell } from "@/components/dashboard/page-shell"
import { Button } from "@/components/ui/button"

export default function MedicinesPage() {
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
      <PagePlaceholder description="Тут буде повний список ліків із фільтрами, сортуванням та швидким редагуванням." />
    </PageShell>
  )
}
