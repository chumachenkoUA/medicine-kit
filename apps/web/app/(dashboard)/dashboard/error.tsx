"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { logClientError } from "@/lib/client-api/errors"

export default function DashboardSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logClientError("DashboardSegment.error", error, { digest: error.digest })
  }, [error])

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="size-5 text-destructive" />
            Сталася помилка на сторінці
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Не вдалося завершити дію. Онови дані або повернись на дашборд.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => reset()}>
              <RotateCcw className="size-4" />
              Спробувати ще раз
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">Повернутися на дашборд</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
