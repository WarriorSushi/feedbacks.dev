import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CalendarCheck2, Check, GraduationCap, RefreshCw, Users } from 'lucide-react'
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
  { icon: Users, title: '100 members, accepted automatically', body: 'If a place is available, it is reserved immediately. There is no review call or selection queue.' },
  { icon: GraduationCap, title: 'Guided product onboarding', body: 'A required built-in tour teaches the feedback form, inbox, installation, updates, and integrations. Pro activates when you finish.' },
  { icon: RefreshCw, title: 'Pro renews with useful feedback', body: 'Near each month’s end, tell us what is good, what is bad, and what should improve. Each complete check-in adds one Pro month.' },
  { icon: CalendarCheck2, title: 'Up to 12 Pro months', body: 'Earn 12 months in total. A missed check-in has a two-month grace period, and the complete programme concludes within 14 months.' },
]

export default async function EarlyAccessPage() {
  const availability = await getEarlyAdopterAvailability()
  return (
    <main className="early-adopter-shell relative min-h-screen overflow-hidden bg-neutral-950 font-sans text-neutral-100 antialiased">
      <BackgroundBeams />
      <header className="relative z-20 border-b border-neutral-800/80 bg-neutral-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-semibold"><BrandWordmark className="text-[17px] text-neutral-100" markClassName="h-6 w-6" dotClassName="text-lime-400" /></Link>
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-100"><ArrowLeft className="h-4 w-4" /> Back to product</Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:gap-20 lg:py-20">
        <section>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Use Pro for a year by helping us make it better.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-400 sm:text-xl">The Early Adopter Programme turns honest monthly product feedback into up to 12 months of Pro. Everything is automated, clearly scheduled, and handled inside your dashboard.</p>

          <div className="mt-10 border-y border-neutral-800">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div key={title} className="grid gap-3 border-b border-neutral-800 py-5 last:border-b-0 sm:grid-cols-[240px_1fr] sm:gap-8">
                <p className="flex items-start gap-3 font-semibold text-neutral-100"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-lime-400" />{title}</p>
                <p className="text-base leading-7 text-neutral-400">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-neutral-300">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-lime-400" /> Fully automated onboarding</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-lime-400" /> Feedback goes to the product inbox</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-lime-400" /> Product data stays when it ends</span>
          </div>
        </section>

        <aside className="lg:sticky lg:top-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Reserve your place</h2>
              <p className="mt-1 text-base text-neutral-400">Accepted immediately when submitted.</p>
            </div>
            <p className="shrink-0 text-base font-semibold text-lime-400">{availability.remaining} of {availability.capacity} left</p>
          </div>
          <LeadForm open={availability.open} />
        </aside>
      </div>
    </main>
  )
}
