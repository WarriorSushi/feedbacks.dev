import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: July 30, 2026
        </p>

        <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
          <h2>Information We Collect</h2>
          <p>
            When you use feedbacks.dev, we collect information you provide directly:
          </p>
          <ul>
            <li>Account information (email, name via GitHub OAuth or magic link)</li>
            <li>Project configuration data</li>
            <li>Feedback submitted through your widgets (messages, ratings, page URL, browser context, optional screenshots or image attachments, and optional contact details)</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain the service</li>
            <li>To send opt-in notifications about feedback activity</li>
            <li>To deliver webhooks to your configured endpoints</li>
            <li>To manage subscriptions and billing when you upgrade to a paid plan</li>
          </ul>

          <h2>Data Storage</h2>
          <p>
            All data is stored securely on Supabase infrastructure with row-level security policies.
            Feedback data belongs to you. You can export or delete it at any time.
          </p>
          <p>
            Feedback screenshots and image attachments are stored in private buckets. They are served
            only through an authenticated, project-owner-authorized download route. Stored integration
            credentials are encrypted and are never returned to the browser after saving.
          </p>

          <h2>Page and Browser Context</h2>
          <p>
            The widget may record the page URL, page title, referrer, browser user agent, viewport,
            language, and time zone so a project owner can reproduce the reported issue. A screenshot
            is captured only when the submitter chooses the screenshot action and the project has that
            field enabled. Automatic page context keeps the origin and path but removes query strings
            and fragments, which often contain tokens or customer data. Project owners should also
            configure allowed origins for sensitive applications.
          </p>

          <h2>Third-Party Services</h2>
          <ul>
            <li><strong>Supabase:</strong> database and authentication</li>
            <li><strong>Vercel:</strong> hosting, privacy-preserving page analytics, and aggregate performance measurement</li>
            <li><strong>GitHub:</strong> optional OAuth authentication</li>
            <li><strong>Dodo Payments:</strong> checkout, billing portal, and subscription events</li>
            <li><strong>Resend:</strong> transactional email delivery for opt-in alerts</li>
          </ul>

          <h2>Data Retention</h2>
          <p>
            Your data is retained as long as your account is active. When you delete a project,
            all associated feedback, screenshots, and uploaded attachments are permanently removed.
            Free plans only surface the most recent 30 days of history in the product, but upgrading
            restores older stored history without recreating it. Account deletion removes account-owned
            product data and uploaded feedback media. Operational delivery and security records are
            retained only as needed to operate, secure, and troubleshoot the service, with destinations
            redacted and credentials excluded.
          </p>

          <h2>Your Rights</h2>
          <p>
            You can export your feedback data as CSV, delete entire projects, or delete your account
            from the Settings page. If you have an active paid subscription, cancel or downgrade it from
            Billing before account deletion.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy or your data? Email{' '}
            <a href="mailto:pashaseenainc@gmail.com" className="underline">pashaseenainc@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
