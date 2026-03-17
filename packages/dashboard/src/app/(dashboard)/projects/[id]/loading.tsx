import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back link + title */}
      <div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-px">
        {Array.from({ length: 6 }).map((_, i) => {
          const widths = [60, 80, 100, 90, 45, 70]
          return (
            <Skeleton key={i} className="h-9 rounded-none" style={{ width: widths[i] }} />
          )
        })}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border bg-card">
        <div className="p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
