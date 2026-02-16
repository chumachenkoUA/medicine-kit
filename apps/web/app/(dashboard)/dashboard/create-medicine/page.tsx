import { CreateMedicineFlow } from "@/components/medicines/create-medicine-flow"
import { PageShell } from "@/components/dashboard/page-shell"

export default function CreateMedicinePage() {
  return (
    <PageShell
      title="Додавання ліків"
      description="Сценарій додавання: пошук у базі, preview з URL і підтвердження даних перед створенням."
    >
      <CreateMedicineFlow />
    </PageShell>
  )
}
