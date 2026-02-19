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
