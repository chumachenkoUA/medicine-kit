import { CreateMedicineFlow } from "@/components/medicines/create-medicine-flow"
import { PageShell } from "@/components/dashboard/page-shell"

export default function CreateMedicinePage() {
  return (
    <PageShell
      title="Додати ліки та упаковки"
      description="Тут ви можете додавати нові ліки у свою базу та упаковки в аптечці"
    >
      <CreateMedicineFlow />
    </PageShell>
  )
}
