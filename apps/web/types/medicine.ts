export type MedicineId = string

export type DoseStatus = "now" | "soon" | "scheduled" | "missed"
export type DoseLogState = "taken" | "missed" | "skipped"

export interface Medicine {
  id: MedicineId
  name: string
  description: string
  form: string
  imageUrl?: string
  packages: MedicinePackage[]
}

export interface MedicineListItem {
  id: MedicineId
  name: string
  imageUrl?: string
  stockLabel: string
  stockCount: number
  stockCapacity: number
  stockUnit: string
  nearestExpiryAt?: string
}

export interface MedicineDashboardItem extends MedicineListItem {
  description: string
  form: string
  packages: MedicinePackage[]
}

export interface MedicinePackage {
  id: string
  tabletsInPack: number
  initialTabletsInPack?: number
  expiresAt: string
  batchNumber?: string
}

export type CourseStatus = "active" | "planned" | "completed" | "paused"

export interface MedicineCourse {
  id: string
  medicineId: MedicineId
  doctorName: string
  title: string
  dosage: string
  frequency: string
  qtyPerDay: number
  times: string[]
  periodDays: number
  periodStart?: string
  periodEnd?: string
  status: CourseStatus
}

export interface UpcomingDose {
  id: MedicineId
  medicineName: string
  time: string
  status: DoseStatus
  statusLabel: string
}

export interface CourseCalendarEvent {
  id: string
  courseId: string
  medicineId: MedicineId
  medicineName: string
  doctorName: string
  title: string
  doseTime: string
  status: "scheduled" | DoseLogState
  start: string
  end: string
  allDay: boolean
}

export interface CourseProgress {
  courseId: string
  from: string | null
  to: string | null
  total: number
  taken: number
  missed: number
  skipped: number
  remaining: number
  adherencePercent: number
}

export interface CourseStockWarning {
  courseId: string
  medicineId: MedicineId
  medicineName: string
  courseStatus: string
  stockCount: number
  dailyNeed: number
  daysLeftEstimate: number
  severity: "ok" | "low" | "empty"
  message: string
  courseEndDate: string | null
}
