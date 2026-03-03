import type { CreateMedicinePayload } from "@/lib/medicines/types"
import type { Medicine, MedicineDashboardItem } from "@/types/medicine"
import type {
  ApiTableto,
  ApiTabletosUser,
  CreateTabletoRequest,
} from "@/lib/medicines/contracts"

function getTabletoImageUrl(item?: ApiTableto | null): string | undefined {
  if (!item) return undefined
  const imageUrl = item.imageUrl?.trim()
  if (imageUrl) return imageUrl
  const photo = item.photo?.trim()
  if (photo) return photo
  const photoUpper = item.Photo?.trim()
  if (photoUpper) return photoUpper
  return undefined
}

export function mapTabletoToDashboardItem(item: ApiTableto): MedicineDashboardItem {
  const id = String(item.Id)
  const quantity = Number(item.Quantity) || 0

  return {
    id,
    name: item.Name,
    imageUrl: getTabletoImageUrl(item),
    description: item.Description ?? "",
    form: item.Format,
    stockLabel: `${quantity} табл.`,
    stockCount: quantity,
    stockCapacity: quantity,
    stockUnit: "табл.",
    nearestExpiryAt: undefined,
    packages: [],
  }
}

export function mapTabletoToMedicine(item: ApiTableto): Medicine {
  return {
    id: String(item.Id),
    name: item.Name,
    description: item.Description ?? "",
    form: item.Format,
    imageUrl: getTabletoImageUrl(item),
    packages: [],
  }
}

function getEntryTabletoId(entry: ApiTabletosUser): string {
  if (entry.tabletos_id != null) return String(entry.tabletos_id)
  if (entry.tabletoId != null) return String(entry.tabletoId)
  if (entry.tabletos?.Id != null) return String(entry.tabletos.Id)
  if (entry.tableto?.Id != null) return String(entry.tableto.Id)
  return String(entry.Id)
}

function toIsoDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function getBestTabletoMeta(
  entry: ApiTabletosUser,
  tabletoById: Map<string, ApiTableto>
): ApiTableto | null {
  const key = getEntryTabletoId(entry)
  return (
    tabletoById.get(key) ??
    (entry.tabletos?.Name ? (entry.tabletos as ApiTableto) : null) ??
    (entry.tableto?.Name ? (entry.tableto as ApiTableto) : null)
  )
}

function resolveInitialPackCount(currentCount: number, tabletoMeta: ApiTableto | null): number {
  const normalizedCurrent = Number.isFinite(currentCount) && currentCount > 0 ? currentCount : 0
  const tabletoQuantity = Number(tabletoMeta?.Quantity ?? 0)
  if (Number.isFinite(tabletoQuantity) && tabletoQuantity > 0) {
    return Math.max(normalizedCurrent, tabletoQuantity)
  }
  return Math.max(normalizedCurrent, 1)
}

export function mapTabletosUsersToDashboardItems(
  entries: ApiTabletosUser[],
  tabletoCatalog: ApiTableto[]
): MedicineDashboardItem[] {
  const tabletoById = new Map(tabletoCatalog.map((item) => [String(item.Id), item]))
  const groups = new Map<string, MedicineDashboardItem>()

  for (const entry of entries) {
    const tabletoId = getEntryTabletoId(entry)
    const tabletoMeta = getBestTabletoMeta(entry, tabletoById)
    const quantity = Number(entry.Count) || 0
    const initialPackCount = resolveInitialPackCount(quantity, tabletoMeta)
    const expiresAt =
      toIsoDate(entry.Expiration_date) ??
      toIsoDate(entry.Create_date) ??
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const existing = groups.get(tabletoId)
    if (!existing) {
      groups.set(tabletoId, {
        id: tabletoId,
        name: tabletoMeta?.Name ?? `Препарат #${tabletoId}`,
        imageUrl: getTabletoImageUrl(tabletoMeta),
        description: tabletoMeta?.Description ?? "",
        form: tabletoMeta?.Format ?? "Невідомо",
        stockLabel: `${quantity} табл.`,
        stockCount: quantity,
        stockCapacity: initialPackCount,
        stockUnit: "табл.",
        nearestExpiryAt: expiresAt,
        packages: [
          {
            id: String(entry.Id),
            tabletsInPack: quantity,
            initialTabletsInPack: initialPackCount,
            expiresAt,
          },
        ],
      })
      continue
    }

    existing.stockCount += quantity
    existing.stockCapacity += initialPackCount
    existing.stockLabel = `${existing.stockCount} табл.`
    existing.packages.push({
      id: String(entry.Id),
      tabletsInPack: quantity,
      initialTabletsInPack: initialPackCount,
      expiresAt,
    })
    if (
      !existing.nearestExpiryAt ||
      new Date(expiresAt).getTime() < new Date(existing.nearestExpiryAt).getTime()
    ) {
      existing.nearestExpiryAt = expiresAt
    }
  }

  return Array.from(groups.values())
}

export function mapTabletosUsersToPackagesByMedicineId(
  entries: ApiTabletosUser[],
  medicineId: string
) {
  return entries
    .filter((entry) => getEntryTabletoId(entry) === medicineId)
    .map((entry) => ({
      // Якщо немає окремого поля initial count, беремо еталон із tableto.Quantity.
      initialTabletsInPack: Math.max(
        Number(entry.Count) || 0,
        Number(entry.tabletos?.Quantity ?? entry.tableto?.Quantity ?? 0) || 0
      ),
      id: String(entry.Id),
      tabletsInPack: Number(entry.Count) || 0,
      expiresAt:
        toIsoDate(entry.Expiration_date) ??
        toIsoDate(entry.Create_date) ??
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }))
}

export function toCreateTabletoRequest(
  payload: CreateMedicinePayload
): CreateTabletoRequest {
  const summedQuantity = payload.packages.reduce(
    (acc, item) => acc + item.tabletsInPack,
    0
  )
  const fallbackQuantity =
    Number.isInteger(payload.totalQuantity) && Number(payload.totalQuantity) > 0
      ? Number(payload.totalQuantity)
      : 1
  const quantity = summedQuantity > 0 ? summedQuantity : fallbackQuantity

  return {
    name: payload.name,
    description: payload.description || undefined,
    quantity,
    format: payload.form,
    link: payload.sourceUrl,
    photo: payload.imageUrl || undefined,
    effects: undefined,
    rate: undefined,
  }
}
