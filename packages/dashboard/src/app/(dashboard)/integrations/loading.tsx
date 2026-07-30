import { Skeleton } from '@/components/ui/skeleton'

export default function IntegrationsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="grid gap-3 border-b px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-72 max-w-full" />
            </div>
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}
