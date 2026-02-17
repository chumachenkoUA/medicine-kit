import { PageShell } from "@/components/dashboard/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form"
import { NotificationSettings } from "@/components/profile/notification-settings"

export default function ProfilePage() {
  return (
    <PageShell
      title="Профіль"
      description="Персональні дані, налаштування сповіщень і керування безпекою акаунта."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ProfileSettingsForm
            initialName="Іван Іваненко"
            initialEmail="ivan@example.com"
            initialTimezone="Europe/Kyiv"
          />
          <NotificationSettings />
        </div>

        <Card className="border-border/70 bg-card/95 dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle>Безпека</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>2FA: не налаштовано</p>
            <p>Останній вхід: сьогодні</p>
            <p>Пристрої: 1 активний</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
