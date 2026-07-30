import { Compass } from 'lucide-react'
import { loadBoardDirectoryPage, type BoardSortMode } from '@/lib/board-discovery'
import { getBoardCategoryLabel } from '@/lib/board-categories'
import { BoardDirectoryClient } from './board-directory-client'
import { cn } from '@/lib/utils'

interface BoardDirectorySurfaceProps {
  sort?: string
  category?: string
  query?: string
  variant?: 'public' | 'dashboard'
}

export async function BoardDirectorySurface({
  sort,
  category,
  query,
  variant = 'public',
}: BoardDirectorySurfaceProps) {
  const activeSort = ['trending', 'active', 'responsive', 'shipping', 'new'].includes(sort || '')
    ? sort as BoardSortMode
    : 'trending'
  const directory = await loadBoardDirectoryPage({
    sort: activeSort,
    category: category?.trim().toLowerCase() || '',
    query: query?.trim() || '',
  })
  const categories = directory.categories.map((entry) => ({
    ...entry,
    label: getBoardCategoryLabel(entry.value),
  }))
  const dashboard = variant === 'dashboard'
  const Root = dashboard ? 'div' : 'main'

  return (
    <Root
      data-tour={dashboard ? 'boards-directory' : undefined}
      className={dashboard ? 'space-y-6' : 'mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-12'}
    >
      <section className="relative border-b border-border/80">
        <div className={cn(
          'relative grid gap-4 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end',
          dashboard ? 'py-7' : 'py-8 sm:py-12',
        )}>
          <div>
            <div className="mb-5 hidden h-12 w-12 items-center justify-center rounded-xl border bg-background/80 text-primary shadow-sm sm:flex">
              <Compass className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Feedback from real users
            </p>
            <h1 className={cn(
              'mt-3 max-w-3xl font-black leading-tight tracking-tighter text-foreground',
              dashboard ? 'text-3xl md:text-4xl' : 'text-2xl sm:text-4xl md:text-5xl',
            )}>
              See what people want teams to build.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/70 sm:mt-3 sm:text-base sm:leading-7">
              Read ideas and bugs. Vote for what matters. See what each team says next.
            </p>
          </div>

          <div className="grid grid-cols-3 divide-x border-y lg:border-y-0">
            {[
              ['Boards', directory.total],
              ['Ideas and bugs', directory.totalRequests],
              ['Team replies', directory.totalReplies],
            ].map(([label, value]) => (
              <div key={label} className="px-3 py-3 sm:px-5 sm:py-4">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                  <span className="sm:hidden">{String(label).replace('Indexed boards', 'Boards').replace('Tracked requests', 'Requests').replace('Public replies', 'Replies')}</span>
                  <span className="hidden sm:inline">{label}</span>
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:mt-2 sm:text-2xl">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BoardDirectoryClient
        entries={directory.entries}
        total={directory.total}
        categories={categories}
        initialSort={activeSort}
        initialCategory={category?.trim().toLowerCase() || ''}
        initialQuery={query?.trim() || ''}
        initialNextCursor={directory.nextCursor}
        initialHasMore={directory.hasMore}
        variant={variant}
      />
    </Root>
  )
}
