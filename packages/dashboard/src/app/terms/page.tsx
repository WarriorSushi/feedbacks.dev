import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: March 2026
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
            your data at any time. See our Privacy Policy for details.
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
            The Free tier includes limited projects, monthly feedback volume, and a 30-day history window.
            Pro unlocks additional projects, unlimited history, webhook routing, and the AI / MCP surfaces.
            Billing is handled through Dodo Payments and subscription changes take effect after verified billing events are processed.
          </p>

          <h2>8. Termination</h2>
          <p>
            You can delete your account at any time from Settings. If you are on a paid plan, you must
            cancel or downgrade it from Billing before deleting the account. We may suspend accounts that violate these terms.
          </p>

          <h2>9. Changes</h2>
          <p>
            We may update these terms. Continued use after changes means acceptance.
          </p>
        </div>
      </div>
    </div>
  )
}
