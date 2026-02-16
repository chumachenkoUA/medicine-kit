export interface SearchMedicineResult {
  id: string
  name: string
  form?: string
}

export interface MedicinePreviewRequest {
  url: string
}

export interface MedicinePreviewResponse {
  sourceUrl: string
  imageUrl?: string
  name?: string
  description?: string
  form?: string
}

export interface CreateMedicinePayload {
  name: string
  description: string
  form: string
  imageUrl?: string
  sourceUrl?: string
  packages: Array<{
    tabletsInPack: number
    expiresAt: string
    batchNumber?: string
  }>
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001"
const MEDICINES_ENDPOINT = `${API_BASE_URL}/medicines`

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const json = (await response.json()) as { message?: string; error?: string }
      const message = json.message ?? json.error
      throw new Error(message || `HTTP ${response.status}`)
    }

    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  return (await response.json()) as T
}

export async function searchMedicines(
  query: string
): Promise<SearchMedicineResult[]> {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  const params = new URLSearchParams({ query: normalizedQuery })
  const response = await fetch(`${MEDICINES_ENDPOINT}/search?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  })

  return parseJsonOrThrow<SearchMedicineResult[]>(response)
}

export async function previewMedicineFromUrl(
  payload: MedicinePreviewRequest
): Promise<MedicinePreviewResponse> {
  const response = await fetch(`${MEDICINES_ENDPOINT}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return parseJsonOrThrow<MedicinePreviewResponse>(response)
}

export async function createMedicine(
  payload: CreateMedicinePayload
): Promise<{ id: string }> {
  const response = await fetch(MEDICINES_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return parseJsonOrThrow<{ id: string }>(response)
}
