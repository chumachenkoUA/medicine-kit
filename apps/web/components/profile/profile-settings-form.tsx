"use client"

import { FormEvent, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface ProfileSettingsFormProps {
  initialName: string
  initialEmail: string
  initialTimezone: string
}

export function ProfileSettingsForm({
  initialName,
  initialEmail,
  initialTimezone,
}: ProfileSettingsFormProps) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [timezone, setTimezone] = useState(initialTimezone)
  const [success, setSuccess] = useState<string | null>(null)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message =
      "Налаштування збережено локально. Наступний крок: інтеграція з API профілю."
    setSuccess(message)
    toast.success(message)
  }

  return (
    <Card className="border-border/70 bg-card/95 dark:bg-card">
      <CardHeader className="pb-2">
        <CardTitle>Персональні дані</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Імʼя та прізвище</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-timezone">Часовий пояс</Label>
            <Input
              id="profile-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="Europe/Kyiv"
            />
          </div>

          <Separator />

          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

          <div className="flex justify-end">
            <Button type="submit">Зберегти зміни</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
