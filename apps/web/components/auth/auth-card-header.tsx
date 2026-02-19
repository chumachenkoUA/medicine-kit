"use client"

import { ModeToggle } from "@/components/mode-toggle"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthCardHeaderProps {
  title: string
  description: string
}

export function AuthCardHeader({ title, description }: AuthCardHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <ModeToggle className="size-8" />
      </div>
    </CardHeader>
  )
}
