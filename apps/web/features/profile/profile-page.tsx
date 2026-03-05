import { cookies } from "next/headers"
import { BellRing, CalendarClock, Mail, ShieldCheck } from "lucide-react"
import { ACCESS_TOKEN_COOKIE, API_BASE_URL } from "@/lib/config/api"

import { NotificationSettings } from "@/components/profile/notification-settings"
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form"
import { PageShell } from "@/components/dashboard/page-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface TokenPayload {
  email?: string
}

interface ProfilePayload {
  Name?: unknown
  Surname?: unknown
  Username?: unknown
  Email?: unknown
  name?: unknown
  surname?: unknown
  username?: unknown
  email?: unknown
}

interface ProfileData {
  name: string
  surname: string
  username: string
  email: string
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

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeProfileData(payload: unknown): ProfileData | null {
  if (!payload || typeof payload !== "object") return null

  const source = payload as ProfilePayload
  const name = normalizeString(source.Name ?? source.name)
  const surname = normalizeString(source.Surname ?? source.surname)
  const username = normalizeString(source.Username ?? source.username)
  const email = normalizeString(source.Email ?? source.email)

  if (!name && !surname && !username && !email) return null

  return { name, surname, username, email }
}

function buildDisplayName(profile: ProfileData | null, fallbackEmail?: string): string {
  const fullName = [profile?.name ?? "", profile?.surname ?? ""].filter(Boolean).join(" ").trim()
  if (fullName) return fullName
  if (profile?.username) return profile.username

  const email = profile?.email || fallbackEmail
  if (!email) return "Користувач"
  const local = email.split("@")[0]?.trim()
  return local || "Користувач"
}

async function fetchProfile(token: string): Promise<ProfileData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) return null

    const payload: unknown = await response.json()
    return normalizeProfileData(payload)
  } catch {
    return null
  }
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

export async function ProfilePage() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value
  const tokenPayload = token ? parseJwtPayload(token) : null
  const profile = token ? await fetchProfile(token) : null
  const email = profile?.email || tokenPayload?.email || ""
  const displayName = buildDisplayName(profile, tokenPayload?.email)
  const initials = buildInitials(displayName)
  const username = profile?.username ?? ""

  return (
    <PageShell
      title="Профіль"
      description="Персональні дані, налаштування сповіщень і керування безпекою акаунта."
      maxWidthClassName="mx-auto w-full max-w-5xl"
    >
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
                  {username ? (
                    <p className="text-xs text-muted-foreground">@{username}</p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">{email || "Email не вказано"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  Сесія активна
                </Badge>
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

        <div className="grid gap-4 xl:grid-cols-2">
          <ProfileSettingsForm
            initialName={displayName}
            initialEmail={email}
            initialTimezone="Europe/Kyiv"
          />
          <NotificationSettings />
        </div>
      </div>
    </PageShell>
  )
}
