import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectLoading() {
  return (
    <div className="space-y-6">
      <div className="-mx-4 -mt-4 border-b border-primary/25 bg-primary/[0.09] px-4 py-3 shadow-sm dark:border-primary/35 dark:bg-primary/[0.16] md:-mx-6 md:-mt-6 md:px-6">
        <div className="flex min-h-11 min-w-max items-center gap-2">
          {[88, 128, 132, 64, 92].map((width) => (
            <Skeleton key={width} className="h-10 rounded-lg" style={{ width }} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
      </div>

      <div className="rounded-lg border-2 border-foreground/15 bg-card p-3 dark:border-primary/25">
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/80 bg-background p-4 shadow-[var(--shadow-card)] dark:border-primary/25">
              <div className="flex gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-4 w-64" />
        <Skeleton className="mt-6 h-36 w-full rounded-lg" />
      </div>
    </div>
  )
}
