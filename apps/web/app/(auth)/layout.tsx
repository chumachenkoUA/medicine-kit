import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Pill } from "lucide-react"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const hasToken = Boolean((await cookies()).get(ACCESS_TOKEN_COOKIE)?.value)
  if (hasToken) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200/60 p-4 dark:from-[oklch(0.18_0.02_255)] dark:via-[oklch(0.2_0.02_255)] dark:to-[oklch(0.24_0.02_255)]">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col justify-center">
        <Link
          href="/"
          className="mb-6 inline-flex items-center justify-center gap-2 self-center"
        >
          <Pill className="size-5 text-primary" />
          <span className="text-lg font-semibold">Medicine Kit</span>
        </Link>
        {children}
      </div>
    </div>
  )
}
