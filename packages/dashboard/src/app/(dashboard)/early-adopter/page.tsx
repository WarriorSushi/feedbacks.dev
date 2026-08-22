import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarClock, CheckCircle2, Clock3, Gift, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createServerSupabase } from '@/lib/supabase-server'
import {
  deriveEarlyAdopterStatus,
  getEarlyAdopterMembershipForUser,
  isEarlyAdopterFeedbackOpen,
} from '@/lib/early-adopter'
import { EarlyAdopterFeedbackForm } from './feedback-form'

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(value)) : 'Not scheduled yet'
}

export default async function EarlyAdopterProgrammePage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/early-adopter')
  const membership = await getEarlyAdopterMembershipForUser(user.id)
  if (!membership) redirect('/early-access')

  const status = deriveEarlyAdopterStatus(membership)
  const feedbackOpen = isEarlyAdopterFeedbackOpen(membership)
  const nextMonth = Math.min(12, membership.pro_months_earned + 1)
  const onboarding = status === 'accepted' || status === 'onboarding'
  const closed = status === 'completed' || status === 'removed'

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Your Early Adopter Programme</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{membership.seat_number ? `You have seat ${membership.seat_number} of 100.` : 'Your place is ready to claim.'} Complete onboarding once to confirm the place and activate Pro, then share one useful check-in near the end of each month to earn up to 12 Pro months.</p>
      </header>

      <section className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-3">
        <div className="border-b p-5 sm:border-b-0 sm:border-r">
          <Gift className="h-5 w-5 text-primary" />
          <p className="mt-3 text-2xl font-semibold">{membership.pro_months_earned} of 12</p>
          <p className="mt-1 text-sm text-muted-foreground">Pro months earned</p>
        </div>
        <div className="border-b p-5 sm:border-b-0 sm:border-r">
          <CalendarClock className="h-5 w-5 text-primary" />
          <p className="mt-3 font-semibold">{formatDate(membership.feedback_opens_at)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Next feedback window</p>
        </div>
        <div className="p-5">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <p className="mt-3 font-semibold capitalize">{status}</p>
          <p className="mt-1 text-sm text-muted-foreground">Programme status</p>
        </div>
      </section>

      {onboarding ? (
        <section className="border-y bg-primary/[0.055] px-5 py-8 sm:rounded-lg sm:border sm:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Complete guided onboarding to activate Pro.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Every step is required. The tour shows where feedback arrives, how to configure and install the form, and where to connect the tools you already use. Your place is counted and Pro activates together when the tour is complete.</p>
          <Button asChild size="lg" className="mt-6"><Link href="/dashboard?tour=1">Start guided onboarding</Link></Button>
        </section>
      ) : feedbackOpen ? (
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight">Share this month’s product check-in</h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">A complete, honest response activates Pro month {nextMonth}. There is no call, observation session, or application review.</p>
          </div>
          <EarlyAdopterFeedbackForm nextMonth={nextMonth} />
        </section>
      ) : status === 'finishing' ? (
        <section className="border-y bg-primary/[0.055] px-5 py-8 sm:rounded-lg sm:border sm:px-8">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">All 12 months earned.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Your final programme month ends {formatDate(membership.programme_ends_at)}. After that, the normal Free or paid plan applies automatically.</p>
        </section>
      ) : closed ? (
        <section className="border-y px-5 py-8 sm:rounded-lg sm:border sm:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">{status === 'completed' ? 'Programme completed.' : 'Programme membership ended.'}</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{status === 'completed' ? 'Thank you for helping shape feedbacks.dev through the full programme.' : 'The two-month feedback grace period ended without a renewal. Your account and feedback remain available under the normal plan.'}</p>
          <Button asChild variant="outline" className="mt-6"><Link href="/invites">Explore Pro for free</Link></Button>
        </section>
      ) : (
        <section className="border-y px-5 py-8 sm:rounded-lg sm:border sm:px-8">
          <Clock3 className="h-8 w-8 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">Your next check-in is not open yet.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">We will open it on {formatDate(membership.feedback_opens_at)} and email you. The due date is {formatDate(membership.feedback_due_at)}.</p>
        </section>
      )}

      <section className="divide-y rounded-lg border bg-card">
        <div className="p-5 sm:p-6">
          <h2 className="text-xl font-semibold">How renewal works</h2>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <div><p className="font-semibold">1. We remind you</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The form and email reminder arrive seven days before your monthly due date.</p></div>
          <div><p className="font-semibold">2. You send useful feedback</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Tell us what is good, what is bad, and what would improve the product.</p></div>
          <div><p className="font-semibold">3. Pro renews automatically</p><p className="mt-2 text-sm leading-6 text-muted-foreground">A valid check-in adds one Pro month, up to 12 total months.</p></div>
        </div>
        <div className="flex items-start gap-3 p-5 sm:p-6">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Two-month grace period:</strong> if you miss a due date, you can still submit within the remaining grace window. The complete programme ends no later than 14 months after onboarding. Your projects and feedback are not deleted.</p>
        </div>
      </section>
    </div>
  )
}
