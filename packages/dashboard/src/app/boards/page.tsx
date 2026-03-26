import Link from 'next/link'
import { loadBoardDirectoryEntries, sortBoardDirectoryEntries, type BoardSortMode } from '@/lib/board-discovery'

const SORT_OPTIONS: Array<{ value: BoardSortMode; label: string; description: string }> = [
  { value: 'trending', label: 'Trending', description: 'Boards with the most recent public activity.' },
  { value: 'active', label: 'Active', description: 'Boards with frequent feedback and replies.' },
  { value: 'responsive', label: 'Responsive', description: 'Boards where teams close the loop publicly.' },
  { value: 'shipping', label: 'Shipping fast', description: 'Boards with strong in-progress and shipped signals.' },
  { value: 'new', label: 'New', description: 'Freshly published boards worth a look.' },
]

export default async function BoardsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sort?: string; category?: string }>
}) {
  const params = await searchParams
  const sort = SORT_OPTIONS.some((option) => option.value === params?.sort) ? (params?.sort as BoardSortMode) : 'trending'
  const category = params?.category?.trim().toLowerCase() || ''
  const entries = await loadBoardDirectoryEntries()
  const categories = [...new Set(entries.flatMap((entry) => entry.branding.categories || []))].sort()
  const filtered = category
    ? entries.filter((entry) => entry.branding.categories?.includes(category))
    : entries
  const sorted = sortBoardDirectoryEntries(filtered, sort)
  const activeSort = SORT_OPTIONS.find((option) => option.value === sort) || SORT_OPTIONS[0]

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_45%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <section className="rounded-[32px] border bg-white/92 p-8 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Public boards</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Browse boards teams chose to publish</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600">
            Public boards are the visible edge of the workflow. If you only need install and triage, start on the homepage; if a team wants public feedback, this is where it shows up.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border bg-white/92 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={category ? `/boards?sort=${option.value}&category=${encodeURIComponent(category)}` : `/boards?sort=${option.value}`}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                    sort === option.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <p className="text-sm text-slate-600">{activeSort.description}</p>
          </div>

          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/boards?sort=${sort}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  !category ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                All categories
              </Link>
              {categories.map((entry) => (
                <Link
                  key={entry}
                  href={`/boards?sort=${sort}&category=${encodeURIComponent(entry)}`}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    category === entry ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {entry}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((entry) => (
            <Link key={entry.slug} href={`/p/${entry.slug}`} className="rounded-3xl border bg-white/92 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: entry.branding.accentColor || '#0f766e' }}
                >
                  {entry.branding.logoEmoji || entry.title.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{entry.title}</p>
                  <p className="truncate text-xs text-slate-500">{entry.projectName}</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">{entry.description}</p>

              {entry.branding.categories && entry.branding.categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.branding.categories.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-xs text-slate-500">Requests</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{entry.feedbackCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-xs text-slate-500">Trust</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{entry.trustScore}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-xs text-slate-500">Replies</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{entry.publicReplyCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <p className="text-xs text-slate-500">Shipping</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{entry.recentlyShippedCount + entry.inProgressCount}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        {sorted.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed bg-white/88 p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No boards match that filter yet</h2>
            <p className="mt-2 text-sm text-slate-600">Try a different category or switch back to all boards.</p>
          </div>
        )}
      </div>
    </div>
  )
}
