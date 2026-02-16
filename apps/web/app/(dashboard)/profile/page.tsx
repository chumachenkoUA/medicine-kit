import { PagePlaceholder } from "@/components/dashboard/page-placeholder"
import { PageShell } from "@/components/dashboard/page-shell"

export default function ProfilePage() {
  return (
    <PageShell
      title="Профіль"
      description="Персональні дані, налаштування сповіщень і керування безпекою акаунта."
    >
      <PagePlaceholder description="Тут будуть персональні дані користувача, налаштування та безпека акаунта." />
    </PageShell>
  )
}
