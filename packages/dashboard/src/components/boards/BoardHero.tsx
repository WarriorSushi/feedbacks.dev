'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, BellPlus, Compass, ExternalLink, MessageSquarePlus } from 'lucide-react'
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
    'Share feedback, see what the team is shipping, and follow the public side of their feedback workflow.'
  const categories = board.branding.categories?.slice(0, 4) || []
  const websiteHost = getWebsiteHost(board.branding.websiteUrl)

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
      <div className="flex flex-col gap-6 px-5 py-5 sm:px-7 sm:py-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Link
              href="/boards"
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All boards
            </Link>
            <span className="text-muted-foreground/35">/</span>
            <span className="font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {board.branding.heroEyebrow || 'Public board'}
            </span>
            {canModerate && (
              <Link
                href={`/projects/${projectId}?tab=board`}
                className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground lg:ml-auto"
              >
                Manage in dashboard
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="mt-5 flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background text-lg font-semibold text-foreground shadow-sm">
              {board.branding.logoEmoji || (board.title || 'F').slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              {board.branding.tagline && (
                <p className="text-sm font-medium text-foreground/70">{board.branding.tagline}</p>
              )}
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {displayTitle}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-foreground/72 sm:text-[1.0625rem]">
                {heroDescription}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:max-w-2xl sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Open requests
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {feedbackCount}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Total votes
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {totalVotes}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Submission mode
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                {board.allow_submissions ? 'Open' : 'Read only'}
              </p>
            </div>
          </div>

          {(categories.length > 0 || websiteHost) && (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
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

        <div className="w-full lg:max-w-xs">
          <div className="rounded-xl border border-border/70 bg-background p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Join the board
            </p>
            <div className="mt-4 space-y-2">
              {board.allow_submissions && (
                <Button
                  onClick={onSubmitClick}
                  className="w-full justify-between px-4 font-semibold"
                >
                  Share feedback
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>
              )}
              <Button
                onClick={onFollowToggle}
                variant={followed ? 'secondary' : 'outline'}
                className={cn(
                  'w-full justify-between px-4',
                  followed && 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/15',
                )}
              >
                <span>{followed ? 'Following' : viewerSignedIn ? 'Follow board' : 'Sign in to follow'}</span>
                <BellPlus className="h-4 w-4" />
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between px-4">
                <Link href="/boards">
                  Browse more boards
                  <Compass className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
