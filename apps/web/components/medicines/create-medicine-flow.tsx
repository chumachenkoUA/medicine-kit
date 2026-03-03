"use client"

import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import type {
  CreateMedicinePackagePayload,
  SearchMedicineResult,
} from "@/lib/client-api/medicines"
import { createMedicinePackage } from "@/lib/client-api/medicines"
import {
  EMPTY_CREATE_PACKAGE_FORM,
  EMPTY_MEDICINE_DETAILS_FORM,
  createPackageFormSchema,
  medicineDetailsFormSchema,
  toCreateMedicineOnlyPayload,
  type CreatePackageFormValues,
  type MedicineDetailsFormValues,
} from "@/lib/medicines/create-form"
import { logClientError, normalizeClientError } from "@/lib/client-api/errors"
import { useCreateMedicine } from "@/components/medicines/hooks/use-create-medicine"
import { useMedicinePreview } from "@/components/medicines/hooks/use-medicine-preview"
import { useMedicineSearch } from "@/components/medicines/hooks/use-medicine-search"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PREVIEW_SUCCESS_MESSAGE =
  "Дані з URL підтягнуті. Перевір поля перед створенням."

function readErrorMessage(message: unknown): string | null {
  return typeof message === "string" && message.trim() ? message : null
}

function extractPackCountHint(...values: Array<string | undefined>): number | null {
  for (const value of values) {
    if (!value) continue
    const match = value.match(/(?:№|N)\s*(\d{1,4})/iu)
    if (!match) continue
    const parsed = Number(match[1])
    if (Number.isInteger(parsed) && parsed > 0) return parsed
  }
  return null
}

export function CreateMedicineFlow() {
  const [previewUrl, setPreviewUrl] = useState("")
  const [previewSuccess, setPreviewSuccess] = useState<string | null>(null)
  const [medicineSuccess, setMedicineSuccess] = useState<string | null>(null)
  const [packageSuccess, setPackageSuccess] = useState<string | null>(null)
  const [selectedMedicine, setSelectedMedicine] =
    useState<SearchMedicineResult | null>(null)
  const [packageSearchQuery, setPackageSearchQuery] = useState("")
  const [packCountHint, setPackCountHint] = useState<number | null>(null)

  const medicineForm = useForm<MedicineDetailsFormValues>({
    resolver: zodResolver(medicineDetailsFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_MEDICINE_DETAILS_FORM,
  })

  const packageForm = useForm<CreatePackageFormValues>({
    resolver: zodResolver(createPackageFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_CREATE_PACKAGE_FORM,
  })

  const {
    register: registerMedicine,
    control: medicineControl,
    formState: medicineFormState,
    getValues: getMedicineValues,
    setValue: setMedicineValue,
    handleSubmit: handleMedicineSubmit,
    reset: resetMedicine,
  } = medicineForm

  const {
    register: registerPackage,
    formState: packageFormState,
    setValue: setPackageValue,
    handleSubmit: handlePackageSubmit,
    reset: resetPackage,
  } = packageForm

  const normalizedSearchQuery = packageSearchQuery.trim()
  const searchQueryResult = useMedicineSearch(normalizedSearchQuery)
  const searchResults =
    normalizedSearchQuery.length >= 2 ? (searchQueryResult.data ?? []) : []
  const searchError =
    normalizedSearchQuery.length >= 2 ? searchQueryResult.error?.message ?? null : null
  const isSearchLoading =
    normalizedSearchQuery.length >= 2 &&
    (searchQueryResult.isLoading || searchQueryResult.isFetching)
  const showSearchEmptyState =
    normalizedSearchQuery.length >= 2 &&
    !isSearchLoading &&
    !searchError &&
    searchResults.length === 0

  const previewMutation = useMedicinePreview({
    onSuccess: (preview) => {
      const currentValues = getMedicineValues()
      setMedicineValue("name", preview.name ?? currentValues.name, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setMedicineValue("description", preview.description ?? currentValues.description, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setMedicineValue("form", preview.form ?? currentValues.form, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setMedicineValue("imageUrl", preview.imageUrl ?? currentValues.imageUrl, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setMedicineValue("sourceUrl", preview.sourceUrl || previewUrl.trim(), {
        shouldDirty: true,
        shouldValidate: true,
      })

      const extractedPackCount = extractPackCountHint(preview.name, preview.description)
      setPackCountHint(extractedPackCount)
      if (extractedPackCount) {
        setMedicineValue("tabletsInPack", String(extractedPackCount), {
          shouldDirty: true,
          shouldValidate: true,
        })
      }

      setPreviewSuccess(PREVIEW_SUCCESS_MESSAGE)
      toast.success("Дані з посилання підтягнуто.")
    },
    onError: (error, variables) => {
      const normalized = normalizeClientError(
        error,
        "Не вдалося отримати попередні дані."
      )
      logClientError("CreateMedicineFlow.preview", error, {
        url: variables.url,
      })
      setPreviewSuccess(null)
      toast.error(normalized.message)
    },
  })

  const createMedicineMutation = useCreateMedicine({
    onSuccess: (created, payload) => {
      setMedicineSuccess("Препарат додано.")
      setPackageSuccess(null)
      setSelectedMedicine({
        id: created.id,
        name: payload.name,
        form: payload.form,
        description: payload.description,
        sourceUrl: payload.sourceUrl,
        imageUrl: payload.imageUrl,
      })
      setPreviewSuccess(null)
      setPreviewUrl("")
      toast.success("Препарат додано.")
    },
    onError: (error, payload) => {
      const normalized = normalizeClientError(error, "Не вдалося створити ліки.")
      logClientError("CreateMedicineFlow.createMedicine", error, {
        name: payload.name,
      })
      setMedicineSuccess(null)
      toast.error(`${normalized.message} Перевір дані і спробуй ще раз.`)
    },
  })

  const createPackageMutation = useMutation<void, Error, CreateMedicinePackagePayload>({
    mutationFn: createMedicinePackage,
    onSuccess: () => {
      setPackageSuccess("Упаковку додано.")
      resetPackage(EMPTY_CREATE_PACKAGE_FORM)
      toast.success("Упаковку успішно додано.")
    },
    onError: (error, variables) => {
      const normalized = normalizeClientError(error, "Не вдалося додати упаковку.")
      logClientError("CreateMedicineFlow.createPackage", error, {
        tabletoId: variables.tabletoId,
        count: variables.count,
        expirationDate: variables.expirationDate,
      })
      setPackageSuccess(null)
      toast.error(normalized.message)
    },
  })

  const handleSelectForPackage = (item: SearchMedicineResult) => {
    setSelectedMedicine(item)
    setPackageSuccess(null)
    const extractedPackCount = extractPackCountHint(
      item.name,
      item.description,
      item.form
    )
    if (extractedPackCount) {
      setPackageValue("tabletsInPack", String(extractedPackCount), {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
    toast.success(`Для упаковки обрано: ${item.name}`)
  }

  const handlePreview = () => {
    const url = previewUrl.trim()
    if (!url) {
      toast.error("Встав URL, щоб підтягнути дані препарату.")
      return
    }

    if (!URL.canParse(url)) {
      toast.error("Вкажи коректний URL для попереднього перегляду.")
      return
    }

    previewMutation.reset()
    setPreviewSuccess(null)
    previewMutation.mutate({ url })
  }

  const onSubmitMedicine = handleMedicineSubmit((values) => {
    setMedicineSuccess(null)
    createMedicineMutation.mutate(toCreateMedicineOnlyPayload(values))
  })

  const onSubmitPackage = handlePackageSubmit((values) => {
    if (!selectedMedicine) {
      toast.error("Спочатку обери препарат через пошук у блоці упаковок.")
      return
    }

    setPackageSuccess(null)
    createPackageMutation.mutate({
      tabletoId: Number(selectedMedicine.id),
      count: Number(values.tabletsInPack),
      expirationDate: values.expiresAt,
    })
  })

  const imagePreviewUrl = useWatch({ control: medicineControl, name: "imageUrl" })
  const imageAlt = useWatch({ control: medicineControl, name: "name" })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Додавання невідомих ліків у базу</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">Пошукати на Tabletki.ua</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={previewUrl}
                  onChange={(event) => setPreviewUrl(event.target.value)}
                  placeholder="https://tabletki.ua/..."
                />
                <Button
                  type="button"
                  onClick={handlePreview}
                  disabled={previewMutation.isPending || !previewUrl.trim()}
                >
                  {previewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Підтягнути дані
                </Button>
              </div>
              {previewMutation.error?.message ? (
                <p className="text-sm text-destructive">{previewMutation.error.message}</p>
              ) : null}
              {previewSuccess ? <p className="text-sm text-emerald-600">{previewSuccess}</p> : null}
            </div>

            <div className="h-px bg-border/70" />

            <form onSubmit={onSubmitMedicine} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="medicine-name">Назва</Label>
                  <Input id="medicine-name" {...registerMedicine("name")} />
                  {readErrorMessage(medicineFormState.errors.name?.message) ? (
                    <p className="text-xs text-destructive">
                      {readErrorMessage(medicineFormState.errors.name?.message)}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicine-form">Форма</Label>
                  <Input id="medicine-form" {...registerMedicine("form")} />
                  {readErrorMessage(medicineFormState.errors.form?.message) ? (
                    <p className="text-xs text-destructive">
                      {readErrorMessage(medicineFormState.errors.form?.message)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicine-source-url">Посилання на джерело</Label>
                <Input id="medicine-source-url" {...registerMedicine("sourceUrl")} />
                {readErrorMessage(medicineFormState.errors.sourceUrl?.message) ? (
                  <p className="text-xs text-destructive">
                    {readErrorMessage(medicineFormState.errors.sourceUrl?.message)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicine-image-url">URL зображення</Label>
                <Input id="medicine-image-url" {...registerMedicine("imageUrl")} />
                {readErrorMessage(medicineFormState.errors.imageUrl?.message) ? (
                  <p className="text-xs text-destructive">
                    {readErrorMessage(medicineFormState.errors.imageUrl?.message)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicine-description">Опис</Label>
                <textarea
                  id="medicine-description"
                  {...registerMedicine("description")}
                  className="border-input bg-transparent ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicine-pack-count">Таблеток у пачці</Label>
                <Input
                  id="medicine-pack-count"
                  type="number"
                  min={1}
                  {...registerMedicine("tabletsInPack")}
                />
                {readErrorMessage(medicineFormState.errors.tabletsInPack?.message) ? (
                  <p className="text-xs text-destructive">
                    {readErrorMessage(medicineFormState.errors.tabletsInPack?.message)}
                  </p>
                ) : null}
                {packCountHint ? (
                  <p className="text-xs text-muted-foreground">
                    Автопідказка з `tabletki.ua`: ймовірно {packCountHint} табл. у пачці.
                  </p>
                ) : null}
              </div>

              {imagePreviewUrl ? (
                <Image
                  src={imagePreviewUrl}
                  alt={imageAlt || "Попередній перегляд зображення ліків"}
                  width={128}
                  height={128}
                  unoptimized
                  className="h-32 w-32 rounded-lg border object-cover"
                />
              ) : null}

              {medicineSuccess ? <p className="text-sm text-emerald-600">{medicineSuccess}</p> : null}
              {createMedicineMutation.error?.message ? (
                <p className="text-sm text-destructive">{createMedicineMutation.error.message}</p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetMedicine(EMPTY_MEDICINE_DETAILS_FORM)
                    setPreviewSuccess(null)
                    setMedicineSuccess(null)
                    setPackCountHint(null)
                  }}
                >
                  Очистити форму
                </Button>
                <Button
                  type="submit"
                  disabled={!medicineFormState.isValid || createMedicineMutation.isPending}
                >
                  {createMedicineMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Додати невідомий препарат
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Додати упаковку</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">Пошук препарату для упаковки</p>
              <Input
                value={packageSearchQuery}
                onChange={(event) => setPackageSearchQuery(event.target.value)}
                placeholder="Введи назву препарату..."
              />
              {searchError ? <p className="text-sm text-destructive">{searchError}</p> : null}
              {isSearchLoading ? (
                <p className="text-sm text-muted-foreground">Пошук...</p>
              ) : null}
              {!isSearchLoading && searchResults.length > 0 ? (
                <div className="space-y-2 rounded-lg border p-3">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
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
                        onClick={() => handleSelectForPackage(item)}
                      >
                        Обрати препарат
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
              {showSearchEmptyState ? (
                <p className="text-sm text-muted-foreground">
                  Нічого не знайдено. Спробуй іншу назву препарату.
                </p>
              ) : null}
            </div>

            <div className="h-px bg-border/70" />

            <form onSubmit={onSubmitPackage} className="space-y-4">
              <div className="space-y-1">
                {selectedMedicine ? (
                  <>
                    <p className="text-xs text-muted-foreground">Обраний препарат</p>
                    <p className="text-sm font-medium">{selectedMedicine.name}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Обери препарат через пошук вище
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="package-count">Таблеток у пачці</Label>
                  <Input
                    id="package-count"
                    type="number"
                    min={1}
                    {...registerPackage("tabletsInPack")}
                  />
                  {readErrorMessage(packageFormState.errors.tabletsInPack?.message) ? (
                    <p className="text-xs text-destructive">
                      {readErrorMessage(packageFormState.errors.tabletsInPack?.message)}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package-expiry">Термін придатності</Label>
                  <Input id="package-expiry" type="date" {...registerPackage("expiresAt")} />
                  {readErrorMessage(packageFormState.errors.expiresAt?.message) ? (
                    <p className="text-xs text-destructive">
                      {readErrorMessage(packageFormState.errors.expiresAt?.message)}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-batch">Партія (опційно)</Label>
                <Input id="package-batch" {...registerPackage("batchNumber")} />
              </div>

              {packageSuccess ? <p className="text-sm text-emerald-600">{packageSuccess}</p> : null}
              {createPackageMutation.error?.message ? (
                <p className="text-sm text-destructive">{createPackageMutation.error.message}</p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedMedicine(null)}
                  disabled={!selectedMedicine}
                >
                  Скинути вибір препарату
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !selectedMedicine ||
                    !packageFormState.isValid ||
                    createPackageMutation.isPending
                  }
                >
                  {createPackageMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Додати упаковку
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
