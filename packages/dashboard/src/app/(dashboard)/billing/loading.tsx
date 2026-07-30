import { Skeleton } from '@/components/ui/skeleton'

export default function BillingLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-5 h-6 w-40" />
        <Skeleton className="mt-3 h-4 w-[32rem] max-w-full" />
        <div className="mt-5 divide-y rounded-lg border bg-muted/10">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid gap-2 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)_220px]">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-36 sm:ml-auto" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  )
}
