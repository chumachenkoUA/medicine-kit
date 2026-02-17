import type { ReactNode } from "react"
import Link from "next/link"
import { Pill } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/60 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex w-full max-w-md justify-end pb-2">
        <ModeToggle />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col justify-center">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <Pill className="size-5 text-primary" />
          <span className="text-lg font-semibold">Medicine Kit</span>
        </Link>
        {children}
      </div>
    </div>
  )
}
