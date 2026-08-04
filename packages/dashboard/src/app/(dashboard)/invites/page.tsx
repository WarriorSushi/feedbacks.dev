import { redirect } from 'next/navigation'
import { Check, Gift, ShieldCheck, UserPlus } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase-server'
import { getReferralProgramSummary } from '@/lib/referrals'
import { getMarketingOrigin } from '@/lib/domain-routing'
import { PageHeader } from '@/components/ui/workspace-shell'
import { InviteLink } from './invite-link'
import { InviteGuide } from './invite-guide'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Invite friends' }

export default async function InvitesPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const program = await getReferralProgramSummary(user.id)
  const inviteUrl = `${getMarketingOrigin()}/r/${program.code}`
  const count = Math.min(5, program.successful_referrals)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Invite program"
        title="Give feedbacks.dev a proper introduction"
        description="Five genuinely activated accounts unlock one complimentary month of Pro. Email confirmation alone does not fill a spot."
        action={<InviteGuide />}
      />

      <section className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-soft)]">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_240px] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4 text-primary" />Your personal invite link</div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Share it with product builders who would genuinely use the product. A new account qualifies after email verification, a 24-hour safety window, and its first verified install or received feedback.</p>
            <div className="mt-5"><InviteLink url={inviteUrl} /></div>
          </div>
          <div className="border-t pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-xs font-medium text-muted-foreground">Progress</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{count}<span className="text-base text-muted-foreground"> / 5</span></p>
            <div className="mt-3 grid grid-cols-5 gap-1.5" aria-label={`${count} of 5 successful invitations`}>
              {Array.from({ length: 5 }, (_, index) => <span key={index} className={`flex h-8 items-center justify-center rounded-md border ${index < count ? 'border-primary/30 bg-primary/10 text-primary' : 'bg-muted/30 text-muted-foreground/40'}`}>{index < count ? <Check className="h-4 w-4" /> : index + 1}</span>)}
            </div>
            {program.pending_referrals > 0 && <p className="mt-3 text-xs text-muted-foreground">{program.pending_referrals} {program.pending_referrals === 1 ? 'invite is' : 'invites are'} completing the safety check.</p>}
            {program.review_referrals > 0 && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{program.review_referrals} {program.review_referrals === 1 ? 'invite needs' : 'invites need'} a manual safety review.</p>}
          </div>
        </div>
        <div className="border-t bg-muted/20 px-5 py-4 sm:px-6">
          {program.reward_granted_at ? (
            <p className="flex items-start gap-2 text-sm"><Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><strong>Reward unlocked.</strong> Complimentary Pro is available through {program.reward_expires_at ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(program.reward_expires_at)) : 'the end of your reward period'}.</span></p>
          ) : (
            <p className="flex items-start gap-2 text-sm text-muted-foreground"><Gift className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><strong className="text-foreground">{5 - count} {5 - count === 1 ? 'qualified account' : 'qualified accounts'} to go.</strong> The one-month reward is added automatically after the fifth genuine activation.</span></p>
          )}
        </div>
      </section>

      {(program.pending_referrals > 0 || program.review_referrals > 0) && (
        <section aria-label="Invitation status legend" className="flex flex-wrap gap-x-5 gap-y-2 border-y py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />Qualified and counted</span>
          <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500" />Activation or 24-hour check pending</span>
          {program.review_referrals > 0 && <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />Manual safety review</span>}
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border-t pt-4"><p className="text-sm font-semibold">Five spots total</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The program is intentionally small and personal, not an unlimited affiliate scheme.</p></div>
        <div className="border-t pt-4"><p className="text-sm font-semibold">Genuine use only</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Existing accounts, self-referrals, duplicate identities, and account farms do not count. Shared networks are reviewed, not automatically blocked.</p></div>
        <div className="border-t pt-4"><p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />One reward</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The complimentary Pro month can be earned once and cannot be transferred or redeemed for cash.</p></div>
      </section>
    </div>
  )
}
