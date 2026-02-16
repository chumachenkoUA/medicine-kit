"use client"

import { useMemo, useState } from "react"
import { Loader2, Plus, Search, Trash2 } from "lucide-react"

import {
  createMedicine,
  previewMedicineFromUrl,
  searchMedicines,
  type CreateMedicinePayload,
  type SearchMedicineResult,
} from "@/lib/api/medicines"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface PackageForm {
  tabletsInPack: string
  expiresAt: string
  batchNumber: string
}

interface FormState {
  name: string
  description: string
  form: string
  imageUrl: string
  sourceUrl: string
  packages: PackageForm[]
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  form: "",
  imageUrl: "",
  sourceUrl: "",
  packages: [{ tabletsInPack: "", expiresAt: "", batchNumber: "" }],
}

export function CreateMedicineFlow() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchMedicineResult[]>([])

  const [previewUrl, setPreviewUrl] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const canSubmit = useMemo(
    () =>
      form.name.trim() &&
      form.form.trim() &&
      form.packages.some(
        (pack) => pack.tabletsInPack.trim() && pack.expiresAt.trim()
      ),
    [form]
  )

  const updateField = (field: keyof Omit<FormState, "packages">, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const updatePackage = (
    index: number,
    field: keyof PackageForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      packages: prev.packages.map((pack, idx) =>
        idx === index ? { ...pack, [field]: value } : pack
      ),
    }))
  }

  const addPackage = () => {
    setForm((prev) => ({
      ...prev,
      packages: [...prev.packages, { tabletsInPack: "", expiresAt: "", batchNumber: "" }],
    }))
  }

  const removePackage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, idx) => idx !== index),
    }))
  }

  const handleSearch = async () => {
    const query = searchQuery.trim()
    if (!query) return

    setSearchLoading(true)
    setSearchError(null)
    setSearchResults([])

    try {
      const result = await searchMedicines(query)
      setSearchResults(result)
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Не вдалося виконати пошук."
      )
    } finally {
      setSearchLoading(false)
    }
  }

  const handlePreview = async () => {
    const url = previewUrl.trim()
    if (!url) return

    setPreviewLoading(true)
    setPreviewError(null)

    try {
      const preview = await previewMedicineFromUrl({ url })
      setForm((prev) => ({
        ...prev,
        name: preview.name ?? prev.name,
        description: preview.description ?? prev.description,
        form: preview.form ?? prev.form,
        imageUrl: preview.imageUrl ?? prev.imageUrl,
        sourceUrl: preview.sourceUrl ?? url,
      }))
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : "Не вдалося отримати попередні дані."
      )
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!canSubmit || submitLoading) return

    setSubmitLoading(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const payload: CreateMedicinePayload = {
        name: form.name.trim(),
        description: form.description.trim(),
        form: form.form.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        sourceUrl: form.sourceUrl.trim() || undefined,
        packages: form.packages
          .filter((pack) => pack.tabletsInPack.trim() && pack.expiresAt.trim())
          .map((pack) => ({
            tabletsInPack: Number(pack.tabletsInPack),
            expiresAt: pack.expiresAt,
            batchNumber: pack.batchNumber.trim() || undefined,
          })),
      }

      const created = await createMedicine(payload)
      setSubmitSuccess(`Ліки створено. ID: ${created.id}`)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Не вдалося створити ліки."
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Крок 1. Пошук у наявній базі</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Введи назву препарату..."
            />
            <Button onClick={handleSearch} disabled={searchLoading}>
              {searchLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Пошук
            </Button>
          </div>

          {searchError ? <p className="text-sm text-destructive">{searchError}</p> : null}

          {searchResults.length > 0 ? (
            <div className="space-y-2 rounded-lg border p-3">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[item.form].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Обрати наявні
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Крок 2. Якщо не знайдено: парсинг з URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={previewUrl}
              onChange={(event) => setPreviewUrl(event.target.value)}
              placeholder="https://tabletki.ua/..."
            />
            <Button onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Підтягнути дані
            </Button>
          </div>
          {previewError ? <p className="text-sm text-destructive">{previewError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Крок 3. Підтвердження і редагування</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medicine-name">Назва</Label>
              <Input
                id="medicine-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine-form">Форма</Label>
              <Input
                id="medicine-form"
                value={form.form}
                onChange={(event) => updateField("form", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine-image">URL зображення</Label>
              <Input
                id="medicine-image"
                value={form.imageUrl}
                onChange={(event) => updateField("imageUrl", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine-description">Опис</Label>
            <textarea
              id="medicine-description"
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="border-input bg-transparent ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicine-source">Посилання на джерело</Label>
            <Input
              id="medicine-source"
              value={form.sourceUrl}
              onChange={(event) => updateField("sourceUrl", event.target.value)}
            />
          </div>

          {form.imageUrl ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Прев’ю зображення</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl}
                alt={form.name || "Попередній перегляд зображення ліків"}
                className="h-32 w-32 rounded-lg border object-cover"
              />
            </div>
          ) : null}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Упаковки</p>
              <Button variant="outline" size="sm" onClick={addPackage}>
                <Plus className="size-4" />
                Додати упаковку
              </Button>
            </div>

            {form.packages.map((pack, index) => (
              <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Таблеток у пачці</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pack.tabletsInPack}
                    onChange={(event) =>
                      updatePackage(index, "tabletsInPack", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Термін придатності</Label>
                  <Input
                    type="date"
                    value={pack.expiresAt}
                    onChange={(event) =>
                      updatePackage(index, "expiresAt", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Партія (опційно)</Label>
                  <Input
                    value={pack.batchNumber}
                    onChange={(event) =>
                      updatePackage(index, "batchNumber", event.target.value)
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-auto"
                    disabled={form.packages.length === 1}
                    onClick={() => removePackage(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
          {submitSuccess ? <p className="text-sm text-emerald-600">{submitSuccess}</p> : null}

          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={!canSubmit || submitLoading}>
              {submitLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Створити ліки
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
