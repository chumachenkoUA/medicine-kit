import { Loader2, Plus, Trash2 } from "lucide-react"
import type {
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form"
import type { CreateMedicineFormValues } from "@/lib/medicines/create-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface ConfirmStepProps {
  register: UseFormRegister<CreateMedicineFormValues>
  errors: FieldErrors<CreateMedicineFormValues>
  packageFields: FieldArrayWithId<CreateMedicineFormValues, "packages", "id">[]
  onAddPackage: () => void
  onRemovePackage: (index: number) => void
  imagePreviewUrl?: string
  imageAlt?: string
  submitError?: string | null
  submitSuccess?: string | null
  isSubmitting: boolean
  canSubmit: boolean
}

function readErrorMessage(message: unknown): string | null {
  return typeof message === "string" && message.trim() ? message : null
}

export function ConfirmStep({
  register,
  errors,
  packageFields,
  onAddPackage,
  onRemovePackage,
  imagePreviewUrl,
  imageAlt,
  submitError,
  submitSuccess,
  isSubmitting,
  canSubmit,
}: ConfirmStepProps) {
  const packagesRootError = Array.isArray(errors.packages)
    ? null
    : readErrorMessage(errors.packages?.message)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Крок 3. Підтвердження і редагування</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="medicine-name">Назва</Label>
            <Input id="medicine-name" {...register("name")} />
            {readErrorMessage(errors.name?.message) ? (
              <p className="text-xs text-destructive">{readErrorMessage(errors.name?.message)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicine-form">Форма</Label>
            <Input id="medicine-form" {...register("form")} />
            {readErrorMessage(errors.form?.message) ? (
              <p className="text-xs text-destructive">{readErrorMessage(errors.form?.message)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="medicine-image">URL зображення</Label>
            <Input id="medicine-image" {...register("imageUrl")} />
            {readErrorMessage(errors.imageUrl?.message) ? (
              <p className="text-xs text-destructive">
                {readErrorMessage(errors.imageUrl?.message)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicine-description">Опис</Label>
          <textarea
            id="medicine-description"
            {...register("description")}
            className="border-input bg-transparent ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
          />
          {readErrorMessage(errors.description?.message) ? (
            <p className="text-xs text-destructive">
              {readErrorMessage(errors.description?.message)}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicine-source">Посилання на джерело</Label>
          <Input id="medicine-source" {...register("sourceUrl")} />
          {readErrorMessage(errors.sourceUrl?.message) ? (
            <p className="text-xs text-destructive">{readErrorMessage(errors.sourceUrl?.message)}</p>
          ) : null}
        </div>

        {imagePreviewUrl ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Прев’ю зображення</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreviewUrl}
              alt={imageAlt || "Попередній перегляд зображення ліків"}
              className="h-32 w-32 rounded-lg border object-cover"
            />
          </div>
        ) : null}

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-medium">Упаковки</p>
            <Button variant="outline" size="sm" type="button" onClick={onAddPackage}>
              <Plus className="size-4" />
              Додати упаковку
            </Button>
          </div>

          {packagesRootError ? <p className="text-xs text-destructive">{packagesRootError}</p> : null}

          {packageFields.map((field, index) => {
            const packageError = Array.isArray(errors.packages)
              ? errors.packages[index]
              : undefined

            return (
              <div key={field.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor={`pack-tablets-${index}`}>Таблеток у пачці</Label>
                  <Input
                    id={`pack-tablets-${index}`}
                    type="number"
                    min={1}
                    {...register(`packages.${index}.tabletsInPack` as const)}
                  />
                  {readErrorMessage(packageError?.tabletsInPack?.message) ? (
                    <p className="text-xs text-destructive">
                      {readErrorMessage(packageError?.tabletsInPack?.message)}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`pack-expiry-${index}`}>Термін придатності</Label>
                  <Input
                    id={`pack-expiry-${index}`}
                    type="date"
                    {...register(`packages.${index}.expiresAt` as const)}
                  />
                  {readErrorMessage(packageError?.expiresAt?.message) ? (
                    <p className="text-xs text-destructive">
                      {readErrorMessage(packageError?.expiresAt?.message)}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`pack-batch-${index}`}>Партія (опційно)</Label>
                  <Input id={`pack-batch-${index}`} {...register(`packages.${index}.batchNumber` as const)} />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-auto"
                    type="button"
                    aria-label={`Видалити упаковку ${index + 1}`}
                    disabled={packageFields.length === 1}
                    onClick={() => onRemovePackage(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        {submitSuccess ? <p className="text-sm text-emerald-600">{submitSuccess}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Створити ліки
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
