import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when using feedbacks.dev.',
}

export default function TermsPage() {
  return (
    <div className="legal-shell min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: August 1, 2026
        </p>

        <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
          <h2>1. Acceptance</h2>
          <p>
            By using feedbacks.dev, you agree to these terms. If you don&apos;t agree, don&apos;t use the service.
          </p>

          <h2>2. The Service</h2>
          <p>
            feedbacks.dev provides an embeddable feedback widget, a dashboard for managing feedback,
            a public feature board with voting, and an API for AI agent integration.
          </p>

          <h2>3. Your Account</h2>
          <ul>
            <li>You&apos;re responsible for your account security</li>
            <li>One person per account</li>
            <li>You must provide accurate information</li>
          </ul>

          <h2>4. Your Data</h2>
          <p>
            You own your data. We store it to provide the service. You can export or delete
            your data at any time. See our <Link href="/privacy">Privacy Policy</Link> for details.
          </p>
          <p>
            If you publish a feedback board, the board content you mark public can be viewed on the
            internet. Draft and unlisted settings control publication and directory discovery separately.
            You are responsible for having a lawful basis to collect feedback and contact information.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>Don&apos;t use the service to:</p>
          <ul>
            <li>Collect data without user consent</li>
            <li>Send spam or abuse the API</li>
            <li>Reverse-engineer the widget or dashboard</li>
            <li>Violate any applicable laws</li>
          </ul>

          <h2>6. Service Availability</h2>
          <p>
            We aim for high availability but don&apos;t guarantee 100% uptime.
            The service is provided &quot;as is&quot; without warranty.
          </p>

          <h2>7. Pricing</h2>
          <p>
            The Free tier includes limited projects, monthly feedback volume, full feedback history,
            limited webhooks, and API / MCP access. Pro raises or removes the project, volume, routing,
            analytics, and branding limits for larger teams.
            Billing is handled through Dodo Payments. Plan changes take effect after verified billing
            events are processed on our server.
          </p>

          <h2>8. Termination</h2>
          <p>
            You can delete your account at any time from Settings. If you are on a paid plan, you must
            cancel or downgrade it from Billing before deleting the account. We may suspend accounts that violate these terms.
          </p>

          <h2>9. Invitation Program</h2>
          <p>
            Each account may use its personal invitation link for up to five verified new-account signups.
            After the fifth eligible signup, the inviter receives one complimentary month of Pro. The reward
            can be earned once, is non-transferable, has no cash value, and may be withheld or reversed for
            self-referrals, duplicate accounts, automation, fraud, or other abuse.
          </p>

          <h2>10. Early Adopter Programme</h2>
          <p>
            The Early Adopter Programme accepts up to 100 members while places remain. Completing guided
            onboarding grants the first complimentary Pro month. Each complete monthly product-feedback
            check-in may grant one additional month, up to 12 total months. Missed check-ins have a two-month
            grace period within a programme window of no more than 14 months after onboarding. The programme
            ends after the final earned month, when the applicable grace period expires, or at that final window.
            Programme access is non-transferable, has no cash value, and may be closed for abuse. Lifecycle
            service emails are part of administering the requested benefit. Programme completion or removal
            does not delete projects or feedback.
          </p>

          <h2>11. Changes</h2>
          <p>
            We may update these terms. Continued use after changes means acceptance.
          </p>

          <h2>12. Contact</h2>
          <p>
            For billing, account, privacy, or support questions, contact us at{' '}
            <a href="mailto:pashaseenainc@gmail.com" className="underline">pashaseenainc@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
