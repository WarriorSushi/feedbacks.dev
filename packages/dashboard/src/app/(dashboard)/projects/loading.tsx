import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="grid gap-3 border-b px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-5 w-44" />
              </div>
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <div className="flex gap-2 md:justify-end">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
