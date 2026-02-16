import { PagePlaceholder } from "@/components/dashboard/page-placeholder"
import { PageShell } from "@/components/dashboard/page-shell"

export default function SchedulePage() {
  return (
    <PageShell
      title="Розклад прийому"
      description="План прийомів по днях, нагадування і швидкий перегляд активних курсів."
    >
      <PagePlaceholder description="Тут буде календар курсів, нагадування і деталізація прийомів по днях." />
    </PageShell>
  )
}
