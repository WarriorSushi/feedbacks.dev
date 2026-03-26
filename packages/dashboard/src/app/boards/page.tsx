import { loadBoardDirectoryEntries, type BoardSortMode } from '@/lib/board-discovery'
import { BoardDirectoryClient } from './board-directory-client'

export const metadata = {
  title: 'Discover Feedback Boards',
  description: 'Browse public feedback boards from teams that ship in the open.',
}

export default async function BoardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; category?: string }>
}) {
  const params = await searchParams
  const entries = await loadBoardDirectoryEntries()
  const categories = [...new Set(entries.flatMap((entry) => entry.branding.categories || []))].sort()

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_45%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <section className="rounded-[32px] border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Public boards
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
            Discover Feedback Boards
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
            Explore products that build in the open. Vote on features, track what ships, and join the conversation.
          </p>
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
