'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Bell, BellOff, ExternalLink, Loader2, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BoardInfo } from './board-types'

interface BoardHeroProps {
  board: BoardInfo
  feedbackCount: number
  totalVotes: number
  canModerate: boolean
  followed: boolean
  followLoading: boolean
  projectId: string
  viewerSignedIn?: boolean
  onSubmitClick: () => void
  onToggleFollow: () => void
}

function getWebsiteHost(url: string | undefined) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function BoardHero({
  board,
  feedbackCount,
  totalVotes,
  canModerate,
  followed,
  followLoading,
  projectId,
  viewerSignedIn = false,
  onSubmitClick,
  onToggleFollow,
}: BoardHeroProps) {
  const displayTitle =
    board.displayName || board.branding.heroTitle || board.title || 'Public feedback board'
  const heroDescription =
    board.branding.heroDescription ||
    board.description ||
    'Share an idea or bug. Vote for things you want. See what the team says next.'
  const categories = board.branding.categories?.slice(0, 4) || []
  const websiteHost = getWebsiteHost(board.branding.websiteUrl)
  const submissionLabel = board.allow_submissions ? 'Anyone can post' : 'Read only'
  const accent = board.branding.accentColor || '#4d7c0f'
  const allBoardsHref = viewerSignedIn ? '/dashboard/boards' : '/boards'

  return (
    <section
      className="relative overflow-hidden border-b border-border/80 bg-background"
      style={{
        borderColor: `${accent}26`,
      }}
    >
      <div className="relative mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Link
            href={allBoardsHref}
            prefetch={false}
            className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All boards
          </Link>
          <span className="text-muted-foreground/35">/</span>
          <span className="font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {board.branding.heroEyebrow || 'Public board'}
          </span>
          {canModerate && (
            <Link
              href={`/projects/${projectId}?tab=board`}
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground sm:ml-auto"
            >
              Manage
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="mt-7">
          <div className="min-w-0">
            <div
              className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border bg-card text-xl"
              style={{ borderColor: `${accent}40` }}
              aria-hidden="true"
            >
              {board.branding.logoEmoji || displayTitle.slice(0, 1).toUpperCase()}
            </div>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
              {displayTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/72">
              {heroDescription}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>
                <strong className="font-semibold text-foreground">{feedbackCount}</strong> requests
              </span>
              <span>
                <strong className="font-semibold text-foreground">{totalVotes}</strong> votes
              </span>
              <span className="font-medium text-foreground/75">
                {submissionLabel}
              </span>
              {board.branding.tagline && (
                <span>
                  {board.branding.tagline}
                </span>
              )}
            </div>

            {(categories.length > 0 || websiteHost) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {category}
                  </span>
                ))}
                {board.branding.websiteUrl && websiteHost && (
                  <a
                    href={board.branding.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {websiteHost}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {board.allow_submissions && (
            <div className="mt-6 rounded-lg border bg-[oklch(var(--surface-raised))] px-4 py-3 text-xs leading-5 text-muted-foreground">
              Posts are public and moderated by {displayTitle}. Do not include passwords, private customer data, or security reports.{' '}
              <Link href="/privacy" className="font-medium text-foreground underline-offset-4 hover:underline">How data is handled</Link>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
            {board.allow_submissions && (
              <Button onClick={onSubmitClick} className="gap-2 font-semibold">
                Share an idea or bug
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant={followed ? 'outline' : 'secondary'}
              onClick={onToggleFollow}
              disabled={followLoading}
              className="gap-2 font-semibold"
            >
              {followLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : followed ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {followed ? 'Following' : 'Get board updates'}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground sm:ml-2">Vote for an idea if it is already here. Add a new one if it is not.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
