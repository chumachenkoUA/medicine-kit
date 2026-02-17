"use client"

import { Pill } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"

const navItems = [
  { href: "/dashboard", label: "Дашборд" },
  { href: "/medicines", label: "Ліки" },
  { href: "/schedule", label: "Розклад" },
  { href: "/dashboard/create-medicine", label: "Додати ліки" },
]

export function DashboardHeader() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-[1200px] flex-wrap items-center gap-3 px-4 py-2 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Pill className="size-6 text-primary" />
          <span className="text-lg font-bold">Medicine Kit</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Input placeholder="Пошук ліків..." className="hidden w-44 md:block md:w-64" />
          <ModeToggle />
          <Link href="/profile">
            <Avatar className="size-9">
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
          </Link>
        </div>

        <nav className="flex w-full gap-2 overflow-x-auto pb-1 md:hidden">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              size="sm"
              asChild
              className="shrink-0"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  )
}
