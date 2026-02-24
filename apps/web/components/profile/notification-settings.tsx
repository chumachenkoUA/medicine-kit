"use client"

import { FormEvent, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function NotificationSettings() {
  const [channel, setChannel] = useState("push")
  const [quietFrom, setQuietFrom] = useState("22:00")
  const [quietTo, setQuietTo] = useState("07:00")
  const [saved, setSaved] = useState<string | null>(null)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = "Налаштування нагадувань збережено локально."
    setSaved(message)
    toast.success(message)
  }

  return (
    <Card className="border-border/70 bg-card/95 dark:bg-card">
      <CardHeader className="pb-2">
        <CardTitle>Нагадування</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-channel">Канал сповіщень</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger id="notification-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="both">Push + Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quiet-from">Тиха година з</Label>
              <Input
                id="quiet-from"
                type="time"
                value={quietFrom}
                onChange={(event) => setQuietFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-to">Тиха година до</Label>
              <Input
                id="quiet-to"
                type="time"
                value={quietTo}
                onChange={(event) => setQuietTo(event.target.value)}
              />
            </div>
          </div>

          {saved ? <p className="text-sm text-emerald-600">{saved}</p> : null}

          <div className="flex justify-end">
            <Button type="submit">Зберегти нагадування</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
