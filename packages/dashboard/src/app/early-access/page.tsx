import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Code2, Inbox, MessageSquare, UsersRound } from 'lucide-react'
import { BrandWordmark } from '@/components/brand-wordmark'
import { LeadForm } from './lead-form'

export const metadata: Metadata = {
  title: 'Apply for the feedbacks.dev Founding Beta',
  description: 'Apply to the limited feedbacks.dev Founding Beta for hands-on setup, direct access, and practical launch guidance.',
  alternates: { canonical: '/early-access' },
}

const benefits = [
  { icon: Code2, title: 'Hands-on setup', body: 'We review your real install path and help the first copy-paste work.' },
  { icon: MessageSquare, title: 'Direct product access', body: 'Share rough edges with the builder and influence the early roadmap.' },
  { icon: Inbox, title: 'A working feedback loop', body: 'Reach first feedback, triage it, and close the loop with a shipped update.' },
]

export default function EarlyAccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="font-semibold"><BrandWordmark className="text-[17px]" markClassName="h-6 w-6" /></Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to product</Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[1fr_440px] lg:items-start lg:py-20">
        <section className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><UsersRound className="h-4 w-4" /> Small founding cohort</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.03] tracking-[-0.045em] sm:text-5xl lg:text-6xl">Help shape the shortest path to useful feedback.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">The Founding Beta is for builders willing to install on a real product, report the rough edges, and talk plainly about what would make the loop indispensable.</p>
          <div className="mt-9 divide-y border-y">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div key={title} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:gap-5">
                <p className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</p>
                <p className="text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 text-xs leading-5 text-muted-foreground">
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Applications are reviewed in small batches, with priority for products that can install soon.</p>
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> This is optional. Anyone can create a Free account now without applying or waiting.</p>
          </div>
        </section>
        <aside>
          <p className="mb-3 text-sm font-semibold">Apply in about a minute</p>
          <LeadForm />
        </aside>
      </div>
    </main>
  )
}
