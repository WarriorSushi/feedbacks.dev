import { Skeleton } from '@/components/ui/skeleton'

export default function NewProjectLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-4 w-28" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-3 h-4 w-72 max-w-full" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-44" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-3 rounded-lg border bg-muted/20 p-3">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
