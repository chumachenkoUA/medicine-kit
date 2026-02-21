import type { CreateMedicinePayload } from "@/lib/medicines/types"
import type { Medicine, MedicineDashboardItem } from "@/types/medicine"
import type {
  ApiTableto,
  ApiTabletosUser,
  CreateTabletoRequest,
} from "@/lib/medicines/contracts"

export function mapTabletoToDashboardItem(item: ApiTableto): MedicineDashboardItem {
  const id = String(item.Id)
  const quantity = Number(item.Quantity) || 0

  return {
    id,
    name: item.Name,
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
    const expiresAt =
      toIsoDate(entry.Expiration_date) ??
      toIsoDate(entry.Create_date) ??
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const existing = groups.get(tabletoId)
    if (!existing) {
      groups.set(tabletoId, {
        id: tabletoId,
        name: tabletoMeta?.Name ?? `Препарат #${tabletoId}`,
        description: tabletoMeta?.Description ?? "",
        form: tabletoMeta?.Format ?? "Невідомо",
        stockLabel: `${quantity} табл.`,
        stockCount: quantity,
        stockCapacity: quantity,
        stockUnit: "табл.",
        nearestExpiryAt: expiresAt,
        packages: [
          {
            id: String(entry.Id),
            tabletsInPack: quantity,
            expiresAt,
          },
        ],
      })
      continue
    }

    existing.stockCount += quantity
    existing.stockCapacity += quantity
    existing.stockLabel = `${existing.stockCount} табл.`
    existing.packages.push({
      id: String(entry.Id),
      tabletsInPack: quantity,
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
  const quantity = payload.packages.reduce(
    (acc, item) => acc + item.tabletsInPack,
    0
  )

  return {
    name: payload.name,
    description: payload.description || undefined,
    quantity,
    format: payload.form,
    link: payload.sourceUrl || "https://example.com",
    photo: payload.imageUrl || undefined,
    effects: undefined,
    rate: undefined,
  }
}
