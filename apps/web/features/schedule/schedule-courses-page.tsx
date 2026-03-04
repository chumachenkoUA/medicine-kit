import { PageShell } from "@/components/dashboard/page-shell"
import { CoursesInteractive } from "@/components/schedule/courses-interactive"
import { getMedicineCourses, getMedicines } from "@/lib/client-api/medicines"

export async function ScheduleCoursesPage() {
  const [medicines, courses] = await Promise.all([getMedicines(), getMedicineCourses()])

  return (
    <PageShell
      title="Курси лікування"
      description="Створення курсів і керування активними та запланованими призначеннями."
    >
      <CoursesInteractive medicines={medicines} initialCourses={courses} />
    </PageShell>
  )
}
