import type { CreateMedicinePayload } from "@/lib/medicines/types"
import type { Medicine, MedicineDashboardItem } from "@/types/medicine"
import type { ApiTableto, CreateTabletoRequest } from "@/lib/medicines/contracts"

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
