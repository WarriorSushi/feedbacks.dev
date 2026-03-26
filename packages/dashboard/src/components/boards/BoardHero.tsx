'use client'

import * as React from 'react'
import Link from 'next/link'
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
  const displayTitle = board.displayName || board.branding.heroTitle || board.title || 'Public feedback board'
  const heroDescription = board.branding.heroDescription || board.description || 'Share feedback, see what the team is shipping, and follow the public side of their feedback workflow.'

  return (
    <section className="relative rounded-[32px] border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 shadow-sm backdrop-blur sm:p-8">
      {canModerate && (
        <Link
          href={`/projects/${projectId}?tab=board`}
          className="absolute right-4 top-4 text-xs font-medium text-slate-500 transition hover:text-primary sm:right-6 sm:top-6"
        >
          Dashboard &rarr;
        </Link>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {board.branding.logoEmoji || (board.title || 'F').slice(0, 1).toUpperCase()}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {board.branding.heroEyebrow || 'Public board'}
          </p>
          {board.branding.tagline && (
            <p className="mt-1 text-sm text-muted-foreground">{board.branding.tagline}</p>
          )}
        </div>
      </div>

      <div className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {displayTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {heroDescription}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          {feedbackCount} {feedbackCount === 1 ? 'idea' : 'ideas'} &middot; {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {board.allow_submissions && (
          <button
            onClick={onSubmitClick}
            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Share Feedback
          </button>
        )}
        <button
          onClick={onFollowToggle}
          className={cn(
            'rounded-2xl border px-4 py-2.5 text-sm font-medium transition',
            followed
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          {followed ? 'Following' : viewerSignedIn ? 'Follow board' : 'Sign in to follow'}
        </button>
        <Link
          href="/boards"
          className="rounded-2xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Browse boards
        </Link>
      </div>
    </section>
  )
}
