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
          Last updated: March 2026
        </p>

        <div className="prose prose-zinc mt-8 max-w-none dark:prose-invert">
          <h2>Information We Collect</h2>
          <p>
            When you use feedbacks.dev, we collect information you provide directly:
          </p>
          <ul>
            <li>Account information (email, name via GitHub OAuth or magic link)</li>
            <li>Project configuration data</li>
            <li>Feedback submitted through your widgets (messages, ratings, screenshots)</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain the service</li>
            <li>To send notifications about feedback activity</li>
            <li>To deliver webhooks to your configured endpoints</li>
          </ul>

          <h2>Data Storage</h2>
          <p>
            All data is stored securely on Supabase infrastructure with row-level security policies.
            Feedback data belongs to you — you can export or delete it at any time.
          </p>

          <h2>Third-Party Services</h2>
          <ul>
            <li><strong>Supabase</strong> — database and authentication</li>
            <li><strong>Vercel</strong> — hosting and deployment</li>
            <li><strong>GitHub</strong> — OAuth authentication (optional)</li>
          </ul>

          <h2>Data Retention</h2>
          <p>
            Your data is retained as long as your account is active. When you delete a project,
            all associated feedback is permanently removed. Account deletion removes all data.
          </p>

          <h2>Your Rights</h2>
          <p>
            You can export your feedback data as CSV, delete individual feedback items,
            delete entire projects, or delete your account at any time from the Settings page.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy? Open an issue on our{' '}
            <a href="https://github.com/WarriorSushi/feedbacks.dev-2026" className="underline">GitHub repository</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
