import type {
  Medicine,
  MedicineCourse,
  MedicineDashboardItem,
  MedicineId,
  UpcomingDose,
} from "@/types/medicine"

const mockMedicines: Medicine[] = [
  {
    id: "1",
    name: "Vitamin D3",
    description:
      "Підтримка рівня вітаміну D. Приймати після їжі згідно з призначеним курсом.",
    form: "Капсули 2000 IU",
    packages: [
      {
        id: "1-1",
        tabletsInPack: 60,
        expiresAt: "2026-11-30",
        batchNumber: "D3-24A",
      },
    ],
  },
  {
    id: "2",
    name: "Amoxicillin",
    description:
      "Антибіотик широкого спектра. Приймати курсом, не пропускати дози.",
    form: "Таблетки 500 мг",
    packages: [
      {
        id: "2-1",
        tabletsInPack: 20,
        expiresAt: "2027-02-28",
        batchNumber: "AMX-88K",
      },
    ],
  },
  {
    id: "3",
    name: "Ibuprofen",
    description:
      "Знеболювальний та протизапальний препарат. Використовувати за потреби.",
    form: "Таблетки 200 мг",
    packages: [
      {
        id: "3-1",
        tabletsInPack: 30,
        expiresAt: "2027-09-30",
        batchNumber: "IB-20X",
      },
      {
        id: "3-2",
        tabletsInPack: 10,
        expiresAt: "2026-06-30",
        batchNumber: "IB-10M",
      },
    ],
  },
  {
    id: "4",
    name: "Magnesium",
    description:
      "Підтримка нервової системи та сну. Рекомендований регулярний вечірній прийом.",
    form: "Таблетки 400 мг",
    packages: [
      {
        id: "4-1",
        tabletsInPack: 90,
        expiresAt: "2028-01-31",
        batchNumber: "MG-41C",
      },
    ],
  },
]

interface MedicineInventorySnapshot {
  medicineId: MedicineId
  stockCount: number
  stockCapacity: number
  stockUnit: string
}

const mockMedicineInventory: MedicineInventorySnapshot[] = [
  {
    medicineId: "1",
    stockCount: 24,
    stockCapacity: 60,
    stockUnit: "капс.",
  },
  {
    medicineId: "2",
    stockCount: 9,
    stockCapacity: 20,
    stockUnit: "табл.",
  },
  {
    medicineId: "3",
    stockCount: 18,
    stockCapacity: 40,
    stockUnit: "табл.",
  },
  {
    medicineId: "4",
    stockCount: 35,
    stockCapacity: 90,
    stockUnit: "табл.",
  },
]

const mockCourses: MedicineCourse[] = [
  {
    id: "c-1",
    medicineId: "1",
    title: "Підтримка вітаміну D",
    dosage: "1 капсула",
    frequency: "1 раз на день",
    times: ["14:00"],
    periodStart: "2026-02-01",
    periodEnd: "2026-04-30",
    status: "active",
  },
  {
    id: "c-2",
    medicineId: "2",
    title: "Курс антибіотика",
    dosage: "1 таблетка",
    frequency: "кожні 8 год",
    times: ["06:30", "14:30", "22:30"],
    periodStart: "2026-02-12",
    periodEnd: "2026-02-19",
    status: "active",
  },
  {
    id: "c-3",
    medicineId: "4",
    title: "Підтримка сну",
    dosage: "1 таблетка",
    frequency: "1 раз на день",
    times: ["15:00"],
    periodStart: "2026-02-10",
    periodEnd: "2026-03-20",
    status: "planned",
  },
]

const mockUpcomingDoses: UpcomingDose[] = [
  {
    id: "1",
    medicineName: "Vitamin D3",
    time: "14:00",
    status: "now",
    statusLabel: "Зараз",
  },
  {
    id: "2",
    medicineName: "Amoxicillin",
    time: "14:30",
    status: "soon",
    statusLabel: "Через 30 хв",
  },
  {
    id: "4",
    medicineName: "Magnesium",
    time: "15:00",
    status: "scheduled",
    statusLabel: "Планово",
  },
]

const medicineById = new Map(mockMedicines.map((medicine) => [medicine.id, medicine]))

function clonePackages(packages: Medicine["packages"]): Medicine["packages"] {
  return packages.map((pack) => ({ ...pack }))
}

function getNearestExpiry(packages: Medicine["packages"]): string | undefined {
  if (packages.length === 0) return undefined

  return [...packages]
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))[0]
    .expiresAt
}

function buildStockLabel(stockCount: number, stockUnit: string): string {
  return `${stockCount} ${stockUnit}`
}

export async function getMedicines(): Promise<MedicineDashboardItem[]> {
  return mockMedicineInventory.flatMap((snapshot) => {
    const medicine = medicineById.get(snapshot.medicineId)
    if (!medicine) return []

    return {
      id: medicine.id,
      name: medicine.name,
      description: medicine.description,
      form: medicine.form,
      stockLabel: buildStockLabel(snapshot.stockCount, snapshot.stockUnit),
      stockCount: snapshot.stockCount,
      stockCapacity: snapshot.stockCapacity,
      stockUnit: snapshot.stockUnit,
      nearestExpiryAt: getNearestExpiry(medicine.packages),
      packages: clonePackages(medicine.packages),
    }
  })
}

export async function getUpcomingDoses(): Promise<UpcomingDose[]> {
  return mockUpcomingDoses.map((dose) => ({ ...dose }))
}

export async function getMedicineById(id: MedicineId): Promise<Medicine | null> {
  const medicine = medicineById.get(id)
  return medicine
    ? {
        ...medicine,
        packages: clonePackages(medicine.packages),
      }
    : null
}

export async function getMedicineCoursesById(
  id: MedicineId
): Promise<MedicineCourse[]> {
  return mockCourses
    .filter((course) => course.medicineId === id)
    .map((course) => ({ ...course, times: [...course.times] }))
}

export async function getMedicineCourses(): Promise<MedicineCourse[]> {
  return mockCourses.map((course) => ({ ...course, times: [...course.times] }))
}
