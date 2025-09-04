import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing and using feedbacks.dev, you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>

            <h2>Description of Service</h2>
            <p>
              feedbacks.dev is a feedback collection platform that allows developers to easily 
              integrate feedback widgets into their websites and applications.
            </p>

            <h2>User Accounts</h2>
            <p>
              To use certain features of our service, you must create an account. You are 
              responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of unauthorized use</li>
            </ul>

            <h2>Acceptable Use</h2>
            <p>You agree not to use the service to:</p>
            <ul>
              <li>Collect feedback in a deceptive or misleading manner</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Transmit malicious code or harmful content</li>
            </ul>

            <h2>Privacy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also 
              governs your use of the service.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              In no event shall feedbacks.dev be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use of the service.
            </p>

            <h2>Contact Information</h2>
            <p>
              Questions about the Terms of Service should be sent to{' '}
              <a href="mailto:legal@feedbacks.dev">legal@feedbacks.dev</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}