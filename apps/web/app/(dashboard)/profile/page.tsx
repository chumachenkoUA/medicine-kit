import { cookies } from "next/headers"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"

import { PageShell } from "@/components/dashboard/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form"
import { NotificationSettings } from "@/components/profile/notification-settings"

interface TokenPayload {
  email?: string
}

function parseJwtPayload(token: string): TokenPayload | null {
  try {
    const base64Payload = token.split(".")[1]
    if (!base64Payload) return null
    const json = Buffer.from(base64Payload, "base64url").toString("utf8")
    return JSON.parse(json) as TokenPayload
  } catch {
    return null
  }
}

function buildDisplayName(email?: string): string {
  if (!email) return "Користувач"
  const local = email.split("@")[0]?.trim()
  return local || "Користувач"
}

export default async function ProfilePage() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
  const payload = token ? parseJwtPayload(token) : null
  const email = payload?.email ?? ""
  const displayName = buildDisplayName(email)

  return (
    <PageShell
      title="Профіль"
      description="Персональні дані, налаштування сповіщень і керування безпекою акаунта."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ProfileSettingsForm
            initialName={displayName}
            initialEmail={email}
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
            <p>Останній вхід: за поточною сесією</p>
            <p>Пристрої: активний браузер</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
