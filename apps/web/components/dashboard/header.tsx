import { Pill } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Pill className="size-6 text-primary" />
          <span className="text-lg font-bold">Medicine Kit</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/dashboard">Дашборд</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/medicines">Ліки</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/schedule">Розклад</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/create-medicine">Додати ліки</Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Input placeholder="Пошук ліків..." className="w-44 md:w-64" />
          <Link href="/profile">
            <Avatar className="size-9">
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
