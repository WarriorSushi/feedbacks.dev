import Link from 'next/link'
import { ArrowRight, CalendarClock, CircleCheck, Sparkles } from 'lucide-react'
import {
  deriveEarlyAdopterStatus,
  isEarlyAdopterFeedbackOpen,
  type EarlyAdopterMembership,
} from '@/lib/early-adopter'

function formatDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

export function EarlyAdopterBanner({ membership }: { membership: EarlyAdopterMembership | null }) {
  if (!membership) return null
  const status = deriveEarlyAdopterStatus(membership)
  if (status === 'completed' || status === 'removed') return null

  const feedbackOpen = isEarlyAdopterFeedbackOpen(membership)
  const grace = status === 'grace'
  const onboarding = status === 'accepted' || status === 'onboarding'
  const finishing = status === 'finishing'

  const title = onboarding
    ? 'Finish the tour to unlock your first Pro month.'
    : finishing
      ? 'You earned all 12 Early Adopter Pro months.'
      : grace
        ? 'Your monthly feedback renewal is overdue.'
        : feedbackOpen
          ? 'Your monthly feedback check-in is ready.'
          : `Early Adopter Pro month ${membership.pro_months_earned} of 12 is active.`
  const detail = onboarding
    ? 'The guided onboarding teaches the core workflow, then activates month one automatically.'
    : finishing
      ? `The programme completes ${formatDate(membership.programme_ends_at) || 'after your final month'}. Your feedback history and projects stay intact.`
      : grace
        ? `Send your check-in by ${formatDate(membership.grace_ends_at) || 'the grace deadline'} to stay in the programme and claim the next month.`
        : feedbackOpen
          ? 'Tell us what is good, what is bad, and what should improve. A complete response unlocks your next Pro month.'
          : `Your next check-in opens ${formatDate(membership.feedback_opens_at) || 'near the end of this month'}.`
  const href = onboarding ? '/dashboard?tour=1' : '/early-adopter'
  const action = onboarding ? 'Start guided onboarding' : feedbackOpen || grace ? 'Send feedback and renew' : 'View programme'
  const Icon = finishing ? CircleCheck : grace ? CalendarClock : Sparkles

  return (
    <div className={grace ? 'sticky top-0 z-30 border-b border-amber-300/50 bg-amber-50/95 px-4 py-3 text-amber-950 backdrop-blur dark:bg-amber-950/95 dark:text-amber-50' : 'sticky top-0 z-30 border-b border-primary/25 bg-primary/[0.08] px-4 py-3 backdrop-blur'}>
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:px-2">
        <div className="flex min-w-0 items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold sm:text-base">{title}</p>
            <p className="mt-0.5 max-w-3xl text-sm leading-5 opacity-75">{detail}</p>
          </div>
        </div>
        {!finishing && (
          <Link href={href} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5">
            {action}<ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
