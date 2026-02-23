import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

interface PreviewStepProps {
  previewUrl: string
  onPreviewUrlChange: (value: string) => void
  onPreview: () => void
  isLoading: boolean
  errorMessage?: string | null
  successMessage?: string | null
}

export function PreviewStep({
  previewUrl,
  onPreviewUrlChange,
  onPreview,
  isLoading,
  errorMessage,
  successMessage,
}: PreviewStepProps) {
  const canPreview = previewUrl.trim().length > 0 && !isLoading

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Крок 2. Якщо не знайдено: парсинг з URL</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            value={previewUrl}
            onChange={(event) => onPreviewUrlChange(event.target.value)}
            placeholder="https://tabletki.ua/..."
          />
          <Button type="button" onClick={onPreview} disabled={!canPreview}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Підтягнути дані
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2 rounded-lg border p-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : null}

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
      </CardContent>
    </Card>
  )
}
