import { PageShell } from "@/components/dashboard/page-shell"
import { ScheduleInteractive } from "@/components/schedule/schedule-interactive"
import { getMedicineCourses, getMedicines } from "@/lib/client-api/medicines"

export async function SchedulePage() {
  const [medicines, courses] = await Promise.all([getMedicines(), getMedicineCourses()])

  return (
    <PageShell
      title="Розклад прийому"
      description="Календар прийомів по днях і найближчі події для поточного дня."
    >
      <ScheduleInteractive medicines={medicines} initialCourses={courses} />
    </PageShell>
  )
}
