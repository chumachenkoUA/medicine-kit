"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import type { SearchMedicineResult } from "@/lib/client-api/medicines"
import {
  EMPTY_CREATE_MEDICINE_FORM,
  EMPTY_PACKAGE,
  createMedicineFormSchema,
  toCreateMedicinePayload,
  type CreateMedicineFormValues,
} from "@/lib/medicines/create-form"
import {
  logClientError,
  normalizeClientError,
} from "@/lib/client-api/errors"
import { SearchStep } from "@/components/medicines/create-flow/search-step"
import { PreviewStep } from "@/components/medicines/create-flow/preview-step"
import { ConfirmStep } from "@/components/medicines/create-flow/confirm-step"
import { useCreateMedicine } from "@/components/medicines/hooks/use-create-medicine"
import { useMedicinePreview } from "@/components/medicines/hooks/use-medicine-preview"
import { useMedicineSearch } from "@/components/medicines/hooks/use-medicine-search"

const PREVIEW_SUCCESS_MESSAGE =
  "Дані з URL підтягнуті. Перевір поля перед створенням."

export function CreateMedicineFlow() {
  const [searchQuery, setSearchQuery] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [previewSuccess, setPreviewSuccess] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const form = useForm<CreateMedicineFormValues>({
    resolver: zodResolver(createMedicineFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_CREATE_MEDICINE_FORM,
  })

  const { control, formState, getValues, handleSubmit, register, reset, setValue } =
    form

  const { fields: packageFields, append, remove } = useFieldArray({
    control,
    name: "packages",
  })

  const normalizedSearchQuery = searchQuery.trim()
  const searchQueryResult = useMedicineSearch(normalizedSearchQuery)
  const searchResults =
    normalizedSearchQuery.length >= 2 ? (searchQueryResult.data ?? []) : []
  const searchError =
    normalizedSearchQuery.length >= 2 ? searchQueryResult.error?.message ?? null : null
  const isSearchLoading =
    normalizedSearchQuery.length >= 2 &&
    (searchQueryResult.isLoading || searchQueryResult.isFetching)

  const previewMutation = useMedicinePreview({
    onSuccess: (preview) => {
      const currentFormValues = getValues()
      setValue("name", preview.name ?? currentFormValues.name, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setValue("description", preview.description ?? currentFormValues.description, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setValue("form", preview.form ?? currentFormValues.form, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setValue("imageUrl", preview.imageUrl ?? currentFormValues.imageUrl, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setValue("sourceUrl", preview.sourceUrl || previewUrl.trim(), {
        shouldDirty: true,
        shouldValidate: true,
      })

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
    onSuccess: (created) => {
      const message = `Ліки створено. ID: ${created.id}`
      setSubmitSuccess(message)
      setPreviewSuccess(null)
      setPreviewUrl("")
      setSearchQuery("")
      reset({
        ...EMPTY_CREATE_MEDICINE_FORM,
        packages: [{ ...EMPTY_PACKAGE }],
      })
      toast.success(`Препарат створено. Перейди до картки ID ${created.id}.`)
    },
    onError: (error, payload) => {
      const normalized = normalizeClientError(error, "Не вдалося створити ліки.")
      logClientError("CreateMedicineFlow.create", error, {
        name: payload.name,
      })
      setSubmitSuccess(null)
      toast.error(`${normalized.message} Перевір дані і спробуй ще раз.`)
    },
  })

  const handlePickExisting = (item: SearchMedicineResult) => {
    const currentFormValues = getValues()

    setValue("name", item.name || currentFormValues.name, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setValue("form", item.form ?? currentFormValues.form, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setValue("description", item.description ?? currentFormValues.description, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setValue("sourceUrl", item.sourceUrl ?? currentFormValues.sourceUrl, {
      shouldDirty: true,
      shouldValidate: true,
    })
    setValue("imageUrl", item.imageUrl ?? currentFormValues.imageUrl, {
      shouldDirty: true,
      shouldValidate: true,
    })

    const message = `Обрано препарат із системи: ${item.name}`
    setSubmitSuccess(message)
    setPreviewSuccess(null)
    toast.success(`Дані "${item.name}" підставлено у форму.`)
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

  const onSubmit = handleSubmit((values) => {
    setSubmitSuccess(null)
    createMedicineMutation.mutate(toCreateMedicinePayload(values))
  })

  const imagePreviewUrl = useWatch({ control, name: "imageUrl" })
  const imageAlt = useWatch({ control, name: "name" })
  const submitError = createMedicineMutation.error?.message ?? null
  const previewError = previewMutation.error?.message ?? null
  const canSubmit = formState.isValid && !createMedicineMutation.isPending

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <SearchStep
        query={searchQuery}
        onQueryChange={setSearchQuery}
        results={searchResults}
        isLoading={isSearchLoading}
        errorMessage={searchError}
        onPickResult={handlePickExisting}
      />

      <PreviewStep
        previewUrl={previewUrl}
        onPreviewUrlChange={setPreviewUrl}
        onPreview={handlePreview}
        isLoading={previewMutation.isPending}
        errorMessage={previewError}
        successMessage={previewSuccess}
      />

      <ConfirmStep
        register={register}
        errors={formState.errors}
        packageFields={packageFields}
        onAddPackage={() => append({ ...EMPTY_PACKAGE })}
        onRemovePackage={remove}
        imagePreviewUrl={imagePreviewUrl}
        imageAlt={imageAlt}
        submitError={submitError}
        submitSuccess={submitSuccess}
        isSubmitting={createMedicineMutation.isPending}
        canSubmit={canSubmit}
      />
    </form>
  )
}
