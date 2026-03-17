import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CodeSnippet } from '@/components/code-snippet'

const installSnippet = `<script
  src="https://cdn.feedbacks.dev/widget.js"
  data-project="your-project-key"
  defer
></script>`

const features = [
  {
    title: 'Quick Install',
    description: 'Add a single script tag. Works with any site — React, Vue, plain HTML. Under 5KB gzipped.',
    icon: '⚡',
  },
  {
    title: 'Smart Triage',
    description: 'Auto-categorize bugs, ideas, and praise. Priority detection and tagging built in.',
    icon: '🧠',
  },
  {
    title: 'Integrations',
    description: 'Push feedback to Slack, Discord, GitHub Issues, or your own webhook. Zero config.',
    icon: '🔗',
  },
  {
    title: 'Lightweight Widget',
    description: 'Beautiful, accessible feedback form that matches your brand. Screenshot capture included.',
    icon: '🎨',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            feedbacks<span className="text-primary">.dev</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            Open Source
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Feedback collection that developers{' '}
            <span className="text-primary">actually want</span> to install
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Collect meaningful in-product feedback in minutes. One script tag,
            a powerful dashboard, and integrations that just work.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free →
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See Features
              </Button>
            </Link>
          </div>
        </div>

        {/* Code Preview */}
        <div className="mx-auto mt-16 max-w-2xl">
          <CodeSnippet
            tabs={[{ label: 'HTML', code: installSnippet, language: 'html' }]}
          />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything you need, nothing you don&apos;t
          </h2>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <div className="mb-2 text-3xl">{f.icon}</div>
                  <CardTitle className="text-xl">{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Simple pricing
          </h2>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>For side projects and indie devs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-3xl font-bold">
                  $0<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ 1 project</li>
                  <li>✓ 100 feedback / month</li>
                  <li>✓ Email notifications</li>
                  <li>✓ 7-day data retention</li>
                </ul>
                <Link href="/auth" className="mt-6 block">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Popular</Badge>
                </div>
                <CardDescription>For teams and growing products</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-3xl font-bold">
                  $19<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Unlimited projects</li>
                  <li>✓ Unlimited feedback</li>
                  <li>✓ Slack, Discord, GitHub</li>
                  <li>✓ Unlimited data retention</li>
                  <li>✓ Custom branding</li>
                  <li>✓ Priority support</li>
                </ul>
                <Link href="/auth" className="mt-6 block">
                  <Button className="w-full">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Ready to collect better feedback?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Set up in under 2 minutes. No credit card required.
          </p>
          <Link href="/auth">
            <Button size="lg">Get Started Free →</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 feedbacks.dev. Open source on GitHub.
        </div>
      </footer>
    </div>
  )
}
