import { loadBoardDirectoryEntries, type BoardSortMode } from '@/lib/board-discovery'
import { BoardDirectoryClient } from './board-directory-client'

export const metadata = {
  title: 'Public Product Boards',
  description: 'Browse public boards from teams that collect feedback in private and share priorities in public.',
}

export default async function BoardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; category?: string }>
}) {
  const params = await searchParams
  const entries = await loadBoardDirectoryEntries()
  const categories = [...new Set(entries.flatMap((entry) => entry.branding.categories || []))].sort()
  const totalRequests = entries.reduce((sum, entry) => sum + entry.feedbackCount, 0)
  const totalReplies = entries.reduce((sum, entry) => sum + entry.publicReplyCount, 0)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_hsl(var(--background))_0%,_hsl(var(--muted))_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <section className="rounded-2xl border border-border/80 bg-card shadow-sm">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Public boards
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
                Public boards worth following
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-foreground/70">
                These boards are the public layer of real feedback workflows. Browse what teams are
                hearing, vote on open requests, and see how roadmap discussion looks when the
                private install and triage loop is already working.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Indexed boards
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {entries.length}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tracked requests
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {totalRequests}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Public replies
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {totalReplies}
                </p>
              </div>
            </div>
          </div>
        </section>

        <BoardDirectoryClient
          entries={entries}
          categories={categories}
          initialSort={(params?.sort as BoardSortMode) || 'trending'}
          initialCategory={params?.category?.trim().toLowerCase() || ''}
        />
      </div>
    </div>
  )
}
