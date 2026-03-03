import type { SearchMedicineResult } from "@/lib/client-api/medicines"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface SearchStepProps {
  title?: string
  query: string
  onQueryChange: (value: string) => void
  results: SearchMedicineResult[]
  isLoading: boolean
  errorMessage?: string | null
  emptyMessage?: string
  pickButtonLabel?: string
  onPickResult: (item: SearchMedicineResult) => void
}

export function SearchStep({
  title,
  query,
  onQueryChange,
  results,
  isLoading,
  errorMessage,
  emptyMessage,
  pickButtonLabel,
  onPickResult,
}: SearchStepProps) {
  const normalizedQuery = query.trim()
  const showEmptyState =
    normalizedQuery.length >= 2 && !isLoading && !errorMessage && results.length === 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title ?? "Крок 1. Пошук у наявній базі"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor="medicine-search-input" className="sr-only">
          Пошук препарату
        </Label>
        <Input
          id="medicine-search-input"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Введи назву препарату..."
        />

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

        {isLoading ? (
          <div className="space-y-2 rounded-lg border p-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {!isLoading && results.length > 0 ? (
          <div className="space-y-2 rounded-lg border p-3">
            {results.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[item.form, item.description].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => onPickResult(item)}
                >
                  {pickButtonLabel ?? "Обрати наявні"}
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {showEmptyState ? (
          <p className="text-sm text-muted-foreground">
            {emptyMessage ??
              "За цим запитом нічого не знайдено. Спробуй іншу назву або парсинг з URL."}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
