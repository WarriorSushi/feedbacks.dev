'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Github, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      setMessage('');

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }

        setMessage('Check your email for the sign-in link!');
        setMessageType('success');
        toast({
          title: 'Magic link sent!',
          description: 'Check your email to complete sign-in.',
        });
      } catch (error: any) {
        setMessage(error.message);
        setMessageType('error');
        toast({
          variant: 'destructive',
          title: 'Sign-in failed',
          description: error.message,
        });
      }
    });
  };

  const handleGithubAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
      toast({
        variant: 'destructive',
        title: 'GitHub sign-in failed',
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-background/95 backdrop-blur">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold">Welcome to feedbacks.dev</CardTitle>
              <CardDescription>
                Sign in to start collecting feedback in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={handleGithubAuth}
                className="w-full gap-2 h-11"
                variant="outline"
                type="button"
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full gap-2 h-11" 
                  disabled={isPending || !email.trim()}
                >
                  {isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Sending magic link...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send magic link
                    </>
                  )}
                </Button>
              </form>

              {message && (
                <Alert className={messageType === 'error' ? 'border-destructive' : 'border-green-500'}>
                  <AlertDescription className={messageType === 'error' ? 'text-destructive' : 'text-green-700'}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  By signing in, you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-primary">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="underline hover:text-primary">
                    Privacy Policy
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