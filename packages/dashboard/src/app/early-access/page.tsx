import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BadgeDollarSign, CalendarCheck2, Check, GraduationCap, RefreshCw, Users } from 'lucide-react'
import { BrandWordmark } from '@/components/brand-wordmark'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { getEarlyAdopterAvailability } from '@/lib/early-adopter'
import { LeadForm } from './lead-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'feedbacks.dev Early Adopter Programme',
  description: 'Join the 100-member feedbacks.dev Early Adopter Programme. Complete guided onboarding, share monthly product feedback, and earn up to 12 months of Pro.',
  alternates: { canonical: '/early-access' },
}

const benefits = [
  { icon: Users, title: 'Only 100 places', body: 'A place is counted only after guided onboarding is complete and Pro activates. Unverified email entries never reduce availability.' },
  { icon: GraduationCap, title: 'Guided product onboarding', body: 'A required built-in tour teaches the feedback form, inbox, installation, updates, and integrations. Pro activates when you finish.' },
  { icon: RefreshCw, title: 'Pro renews with useful feedback', body: 'Near each month’s end, tell us what is good, what is bad, and what should improve. Each complete check-in adds one Pro month.' },
  { icon: CalendarCheck2, title: 'Up to 12 Pro months', body: 'Earn 12 months in total. A missed check-in has a two-month grace period, and the complete programme concludes within 14 months.' },
  { icon: BadgeDollarSign, title: 'Five years of price protection', body: 'Your Pro price is grandfathered for at least five years from the day you join, even if the public price increases.' },
]

export default async function EarlyAccessPage() {
  const availability = await getEarlyAdopterAvailability()
  return (
    <main className="early-adopter-shell relative min-h-screen overflow-hidden bg-background font-sans text-foreground antialiased">
      <BackgroundBeams />
      <header className="relative z-20 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:h-16 sm:px-8">
          <Link href="/" className="font-semibold"><BrandWordmark className="text-[17px] text-foreground" markClassName="h-6 w-6" dotClassName="text-primary" /></Link>
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to product</Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-9 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start lg:gap-16 lg:py-12">
        <section>
          <h1 className="max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">Use Pro for a year by helping us make it better.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/75 sm:text-lg">Complete guided onboarding, then share one honest check-in near each month&apos;s end. Each completed check-in earns the next Pro month, up to 12.</p>

          <div className="mt-7 border-y border-border/90">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div key={title} className="grid gap-2 border-b border-border/90 py-3.5 last:border-b-0 sm:grid-cols-[210px_1fr] sm:gap-6">
                <p className="flex items-start gap-3 font-semibold text-foreground"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{title}</p>
                <p className="text-sm leading-6 text-foreground/75 sm:text-base">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/80">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Fully automated onboarding</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Feedback goes to the product inbox</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Product data stays when it ends</span>
          </div>
        </section>

        <aside className="lg:sticky lg:top-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Claim your place</h2>
              <p className="mt-1 text-sm text-foreground/75 sm:text-base">Sign in and finish onboarding to confirm it.</p>
            </div>
            <p className="shrink-0 text-base font-semibold text-primary">{availability.remaining} of {availability.capacity} unclaimed</p>
          </div>
          <LeadForm open={availability.open} />
        </aside>
      </div>
    </main>
  )
}
