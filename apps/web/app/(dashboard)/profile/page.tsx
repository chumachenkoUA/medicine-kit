import { cookies } from "next/headers"
import { BellRing, CalendarClock, Mail, ShieldCheck, UserRound } from "lucide-react"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"

import { PageShell } from "@/components/dashboard/page-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function buildInitials(value: string): string {
  const source = value.trim()
  if (!source) return "U"
  const parts = source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
  if (parts.length === 0) return "U"
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("")
}

export default async function ProfilePage() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
  const payload = token ? parseJwtPayload(token) : null
  const email = payload?.email ?? ""
  const displayName = buildDisplayName(email)
  const initials = buildInitials(displayName)

  return (
    <PageShell
      title="Профіль"
      description="Персональні дані, налаштування сповіщень і керування безпекою акаунта."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="border-border/70 bg-card/95 dark:bg-card">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar size="lg" className="size-14 ring-2 ring-border/70">
                    <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold leading-none">{displayName}</p>
                    <p className="text-sm text-muted-foreground">{email || "Email не вказано"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    Сесія активна
                  </Badge>
                  <Button variant="outline" size="sm">
                    Змінити пароль
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">Канал сповіщень</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                    <BellRing className="size-4 text-primary" />
                    Push
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">Часовий пояс</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="size-4 text-primary" />
                    Europe/Kyiv
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">Контакт</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                    <Mail className="size-4 text-primary" />
                    {email || "Не задано"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProfileSettingsForm
            initialName={displayName}
            initialEmail={email}
            initialTimezone="Europe/Kyiv"
          />
          <NotificationSettings />
        </div>

        <Card className="h-fit border-border/70 bg-card/95 dark:bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4 text-primary" />
              Безпека та сесія
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>2FA: не налаштовано</p>
            <p>Останній вхід: поточна сесія</p>
            <p>Пристрій: активний браузер</p>
            <p>Доступ: авторизований токен</p>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Переглянути активні сесії
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
