import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
      <EmptyState
        className="w-full"
        icon={SearchX}
        title="Nothing lives at this address"
        description="The item may have moved, been deleted, or belong to a different project. Your existing data is unaffected."
        action={(
          <Button asChild>
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Return to dashboard</Link>
          </Button>
        )}
        detail="If you followed a project link, switch to that project and try again."
      />
    </main>
  )
}
