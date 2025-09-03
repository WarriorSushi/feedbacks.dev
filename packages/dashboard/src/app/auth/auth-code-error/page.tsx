import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/auth">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-background/95 backdrop-blur">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
              <CardDescription>
                There was an issue signing you in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The authentication process was not completed successfully. This could be due to:
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span>•</span>
                  <span>You canceled the authentication process</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>•</span>
                  <span>There was a temporary issue with the authentication service</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>•</span>
                  <span>Your session may have expired</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/auth">
                    Try Again
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">
                    Back to Home
                  </Link>
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Still having trouble?{' '}
                  <Link href="mailto:support@feedbacks.dev" className="underline hover:text-primary">
                    Contact support
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}