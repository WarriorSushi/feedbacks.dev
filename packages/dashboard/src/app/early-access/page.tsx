import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Code2, Inbox, MessageSquare } from 'lucide-react'
import { BrandWordmark } from '@/components/brand-wordmark'
import { LeadForm } from './lead-form'

export const metadata: Metadata = {
  title: 'Get feedbacks.dev launch notes',
  description: 'Join the feedbacks.dev launch list for practical install guidance and product updates.',
  alternates: { canonical: '/early-access' },
}

const benefits = [
  { icon: Code2, title: 'A cleaner install', body: 'Get the short checklist we use to make the first copy-paste work.' },
  { icon: MessageSquare, title: 'Better feedback prompts', body: 'Ask for context without forcing users through a survey.' },
  { icon: Inbox, title: 'A calmer feedback loop', body: 'Triage what matters and close the loop with visible updates.' },
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">For product builders</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.03] tracking-[-0.045em] sm:text-5xl lg:text-6xl">Make feedback useful before it becomes noise.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Join for concise launch notes, install guidance, and the product decisions behind a developer-first feedback loop.</p>
          <div className="mt-9 divide-y border-y">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div key={title} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr] sm:gap-5">
                <p className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</p>
                <p className="text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> No sales call required. The free product remains available now.</p>
        </section>
        <aside>
          <p className="mb-3 text-sm font-semibold">Get the useful updates</p>
          <LeadForm />
        </aside>
      </div>
    </main>
  )
}
