import { PageShell } from "@/components/dashboard/page-shell"
import { ScheduleInteractive } from "@/components/schedule/schedule-interactive"
import { getMedicineCourses, getMedicines } from "@/lib/client-api/medicines"

export default async function SchedulePage() {
  const [medicines, courses] = await Promise.all([getMedicines(), getMedicineCourses()])

  return (
    <PageShell
      title="Розклад прийому"
      description="План прийомів по днях, нагадування і швидкий перегляд активних курсів."
    >
      <ScheduleInteractive medicines={medicines} initialCourses={courses} />
    </PageShell>
  )
}
