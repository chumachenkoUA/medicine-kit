import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/dashboard/header"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top_right,rgba(161,196,253,0.22),transparent_45%),radial-gradient(circle_at_10%_40%,rgba(167,243,208,0.18),transparent_40%),oklch(0.985_0.004_255)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(0.975_0.006_255))]" />
      <DashboardHeader />
      <main className="relative mx-auto w-full max-w-[1240px] px-4 py-5 md:px-6 md:py-7">
        {children}
      </main>
    </div>
  )
}
