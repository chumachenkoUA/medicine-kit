import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-card p-4 md:p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-2/3" />
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-7 w-52" />
        <Card className="sticky top-20 z-20">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <Skeleton className="h-10 w-full md:max-w-sm" />
            <Skeleton className="h-10 w-full md:w-44" />
            <Skeleton className="h-10 w-full md:ml-auto md:w-28" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-2/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
