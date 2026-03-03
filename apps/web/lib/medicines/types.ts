export interface CreateMedicinePayload {
  name: string
  description: string
  form: string
  imageUrl?: string
  sourceUrl: string
  totalQuantity?: number
  packages: Array<{
    tabletsInPack: number
    expiresAt: string
    batchNumber?: string
  }>
}
