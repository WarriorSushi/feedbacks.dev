import Image from 'next/image'
import { Bug, Camera, MonitorSmartphone } from 'lucide-react'

export function LandingFeedbackSnapshot() {
  return (
    <figure className="landing-feedback-snapshot relative mx-auto w-full max-w-3xl pb-16 sm:pb-12 lg:pb-8">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.17_0.012_135)] text-[oklch(0.965_0.009_118)] shadow-[0_34px_90px_-34px_oklch(0.25_0.055_138/0.52)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.9_0.22_128)] text-[11px] font-black text-[oklch(0.21_0.04_130)]">A</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">ACME Corp</p>
              <p className="mt-0.5 text-[10px] text-zinc-500">Feedback inbox</p>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500">Received just now</span>
        </div>

        <div className="grid min-h-[420px] md:grid-cols-[minmax(0,1.35fr)_minmax(190px,0.65fr)]">
          <div className="border-b border-white/10 p-5 sm:p-7 md:border-b-0 md:border-r">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[oklch(0.73_0.16_24)]">
              <Bug className="h-3.5 w-3.5" /> Bug report
            </div>
            <h3 className="mt-5 max-w-xl text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">Export freezes after I choose the last 90 days.</h3>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">The spinner stays forever. Refreshing brings the report back, but the download never starts.</p>

            <div className="mt-7 overflow-hidden rounded-xl border border-white/10 bg-[oklch(0.205_0.012_132)]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="inline-flex items-center gap-2 text-[10px] font-medium text-zinc-300"><Camera className="h-3.5 w-3.5 text-[oklch(0.9_0.22_128)]" />Screenshot</span>
                <span className="text-[9px] text-zinc-600">1440 × 900</span>
              </div>
              <div className="relative h-36 overflow-hidden bg-[oklch(0.95_0.02_132)] p-4 text-[oklch(0.27_0.035_132)] sm:h-40">
                <div className="h-2 w-24 rounded-full bg-[oklch(0.7_0.02_132)]" />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <span className="h-16 rounded-lg border border-[oklch(0.85_0.018_132)] bg-[oklch(0.985_0.008_132)]" />
                  <span className="h-16 rounded-lg border border-[oklch(0.85_0.018_132)] bg-[oklch(0.985_0.008_132)]" />
                  <span className="h-16 rounded-lg border border-[oklch(0.85_0.018_132)] bg-[oklch(0.985_0.008_132)]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-[oklch(0.95_0.02_132/0.72)]">
                  <span className="rounded-lg border border-[oklch(0.78_0.024_132)] bg-[oklch(0.985_0.008_132)] px-4 py-3 text-[10px] font-semibold shadow-lg">Preparing export…</span>
                </div>
              </div>
            </div>
          </div>

          <dl className="divide-y divide-white/10 px-5 sm:px-6">
            <div className="py-5">
              <dt className="text-[10px] text-zinc-500">Page</dt>
              <dd className="mt-2 break-all font-mono text-[11px] text-zinc-200">/reports/export</dd>
            </div>
            <div className="py-5">
              <dt className="text-[10px] text-zinc-500">Browser</dt>
              <dd className="mt-2 inline-flex items-center gap-2 text-xs text-zinc-200"><MonitorSmartphone className="h-3.5 w-3.5 text-[oklch(0.9_0.22_128)]" />Edge on Windows</dd>
            </div>
            <div className="py-5">
              <dt className="text-[10px] text-zinc-500">Rating</dt>
              <dd className="mt-2 text-xs tracking-[0.2em] text-amber-300" aria-label="Two out of five stars">★★☆☆☆</dd>
            </div>
            <div className="py-5">
              <dt className="text-[10px] text-zinc-500">Status</dt>
              <dd className="mt-2 text-xs text-[oklch(0.9_0.22_128)]">New</dd>
            </div>
          </dl>
        </div>
      </div>

      <Image
        src="/feedbacks.dev_mascot.png"
        alt="feedbacks.dev mascot presenting the captured feedback context"
        width={180}
        height={180}
        className="landing-snapshot-mascot absolute -bottom-4 -left-5 h-28 w-28 object-contain drop-shadow-[0_18px_22px_oklch(0.12_0.01_132/0.24)] sm:-left-12 sm:h-36 sm:w-36"
      />
      <figcaption className="absolute bottom-3 left-24 max-w-[210px] rounded-xl border bg-card px-4 py-3 text-xs font-medium leading-5 text-card-foreground shadow-[var(--shadow-card)] sm:bottom-1 sm:left-20">
        The page, browser, rating, and screenshot came with it.
      </figcaption>
    </figure>
  )
}
