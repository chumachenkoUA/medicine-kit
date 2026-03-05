"use client"

import { LogOut, Menu, Pill } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { logoutAction } from "@/app/(auth)/actions"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { href: "/dashboard", label: "Дашборд" },
  { href: "/schedule", label: "Розклад" },
  { href: "/schedule/courses", label: "Курси" },
  { href: "/dashboard/basket", label: "Корзина" },
  { href: "/dashboard/create-medicine", label: "Додати ліки" },
]

export function DashboardHeader() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    if (href === "/schedule") return pathname === "/schedule"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
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
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Відкрити меню навігації"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
              <SheetHeader className="border-b border-border/70">
                <SheetTitle>Навігація</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  </SheetClose>
                ))}
              </nav>
              <Separator />
              <SheetFooter className="p-3 pt-3">
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/70 p-2">
                  <span className="text-sm text-muted-foreground">Тема</span>
                  <ModeToggle />
                </div>
                <SheetClose asChild>
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/profile">
                      <Avatar className="size-7">
                        <AvatarFallback>MK</AvatarFallback>
                      </Avatar>
                      Профіль
                    </Link>
                  </Button>
                </SheetClose>
                <form action={logoutAction}>
                  <Button type="submit" variant="outline" className="w-full justify-start gap-2">
                    <LogOut className="size-4" />
                    Вийти
                  </Button>
                </form>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div className="hidden items-center gap-3 md:flex">
            <ModeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                <LogOut className="size-4" />
                Вийти
              </Button>
            </form>
            <Link href="/profile">
              <Avatar className="size-9">
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
