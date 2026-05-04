'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, BellPlus, ExternalLink, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BoardInfo } from './board-types'

interface BoardHeroProps {
  board: BoardInfo
  feedbackCount: number
  totalVotes: number
  followed: boolean
  viewerSignedIn: boolean
  canModerate: boolean
  projectId: string
  onFollowToggle: () => void
  onSubmitClick: () => void
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
  followed,
  viewerSignedIn,
  canModerate,
  projectId,
  onFollowToggle,
  onSubmitClick,
}: BoardHeroProps) {
  const displayTitle =
    board.displayName || board.branding.heroTitle || board.title || 'Public feedback board'
  const heroDescription =
    board.branding.heroDescription ||
    board.description ||
    'Vote on requests, add context, and follow the public layer of a feedback workflow that starts inside the product.'
  const categories = board.branding.categories?.slice(0, 4) || []
  const websiteHost = getWebsiteHost(board.branding.websiteUrl)
  const submissionLabel = board.allow_submissions ? 'Open submissions' : 'Read only'

  return (
    <section className="z-20 border-b border-border/80 bg-card/95 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl lg:sticky lg:top-0">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Link
            href="/boards"
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

        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.9rem]">
              {displayTitle}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/72 sm:text-base">
              {heroDescription}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>
                <strong className="font-semibold text-foreground">{feedbackCount}</strong> requests
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/45 sm:inline-flex" />
              <span>
                <strong className="font-semibold text-foreground">{totalVotes}</strong> votes
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/45 sm:inline-flex" />
              <span className="font-medium text-foreground/75">{submissionLabel}</span>
              {board.branding.tagline && (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/45 sm:inline-flex" />
                  <span>{board.branding.tagline}</span>
                </>
              )}
            </div>

            {(categories.length > 0 || websiteHost) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {categories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
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

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:justify-end">
            {board.allow_submissions && (
              <Button onClick={onSubmitClick} className="gap-2 px-4 font-semibold">
                Share feedback
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={onFollowToggle}
              variant={followed ? 'secondary' : 'outline'}
              className={cn(
                'gap-2 px-4',
                followed && 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/15',
              )}
            >
              <span>{followed ? 'Following' : viewerSignedIn ? 'Follow board' : 'Sign in to follow'}</span>
              <BellPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
