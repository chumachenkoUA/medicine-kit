import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageShellProps {
  title: string
  description?: string
  action?: ReactNode
  maxWidthClassName?: string
  children: ReactNode
}

export function PageShell({
  title,
  description,
  action,
  maxWidthClassName,
  children,
}: PageShellProps) {
  return (
    <section className="space-y-4 md:space-y-5">
      <header
        className={cn(
          "dashboard-reveal flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 md:p-5 dark:bg-card/95",
          maxWidthClassName
        )}
        style={{ animationDelay: "0ms" }}
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      <div
        className={cn("dashboard-stagger", maxWidthClassName)}
        style={{ animationDelay: "70ms" }}
      >
        {children}
      </div>
    </section>
  )
}
