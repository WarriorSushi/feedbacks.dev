'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app:error]', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
      <EmptyState
        className="w-full"
        icon={AlertTriangle}
        title="This screen could not load"
        description="Your data was not changed. Retry the request, or return to a known-good workspace screen."
        action={(
          <>
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button variant="outline" asChild><Link href="/dashboard">Return to dashboard</Link></Button>
          </>
        )}
        detail={error.digest ? <span className="font-mono">Reference {error.digest}</span> : 'If this keeps happening, contact support and tell us which action you were taking.'}
      />
    </main>
  )
}
