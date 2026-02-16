import type { ReactNode } from "react"

interface PageShellProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function PageShell({ title, description, action, children }: PageShellProps) {
  return (
    <section className="space-y-4 md:space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card/70 p-4 md:p-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      {children}
    </section>
  )
}
