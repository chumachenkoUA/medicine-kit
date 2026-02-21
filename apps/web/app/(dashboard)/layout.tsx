import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ACCESS_TOKEN_COOKIE } from "@/lib/config/api"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const hasToken = Boolean((await cookies()).get(ACCESS_TOKEN_COOKIE)?.value)
  if (!hasToken) {
    redirect("/login")
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_88%_-8%,rgba(120,174,255,0.22),transparent_40%),radial-gradient(circle_at_14%_4%,rgba(45,212,191,0.16),transparent_35%),oklch(0.985_0.004_255)] dark:bg-[radial-gradient(circle_at_85%_-10%,rgba(34,211,238,0.16),transparent_40%),radial-gradient(circle_at_18%_-2%,rgba(74,222,128,0.12),transparent_35%),oklch(0.19_0.018_255)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(0.975_0.006_255))] dark:bg-[linear-gradient(to_bottom,transparent,oklch(0.17_0.02_255))]" />
      <DashboardHeader />
      <main className="relative mx-auto w-full max-w-[1240px] px-4 py-5 md:px-6 md:py-7">
        {children}
      </main>
    </div>
  )
}
