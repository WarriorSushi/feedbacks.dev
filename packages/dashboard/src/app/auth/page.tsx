'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Github, Mail, ArrowLeft, Chrome, MessageSquare, Key } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Check if we're here to sign out
        const urlParams = new URLSearchParams(window.location.search);
        const shouldSignOut = urlParams.get('signout') === 'true';
        
        if (shouldSignOut) {
          console.log('=== AUTH PAGE: Sign out requested ===');
          
          // Clear server-side session
          const serverSignOutResponse = await fetch('/api/sign-out', { 
            method: 'POST',
            credentials: 'include'
          });
          
          if (serverSignOutResponse.ok) {
            console.log('AUTH PAGE: Server sign-out successful');
          } else {
            console.error('AUTH PAGE: Server sign-out failed');
          }
          
          // Clear client-side session
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('AUTH PAGE: Client sign-out error:', error);
          } else {
            console.log('AUTH PAGE: Client sign-out successful');
          }
          
          // Remove the signout parameter from URL
          window.history.replaceState({}, document.title, '/auth');
          
          toast({
            title: "Signed out successfully",
            description: "You have been signed out of your account.",
          });
          
          return; // Don't check for user after sign out
        }
        
        console.log('=== AUTH PAGE: Checking user authentication ===');
        
        // Add timeout protection
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 2000)
        );
        
        const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;
        
        console.log('AUTH PAGE: User check result:', {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          cookies: document.cookie
        });
        
        if (user) {
          console.log('AUTH PAGE: User authenticated, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('AUTH PAGE: No user found, staying on auth page');
        }
      } catch (error) {
        console.error('AUTH PAGE: Auth check error:', error);
      }
    };
    
    checkUser();
  }, [router, supabase, toast]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      setMessage('');

      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `https://app.feedbacks.dev/auth/callback`,
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

  const handleOAuthAuth = async (provider: 'github' | 'google' | 'discord') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `https://app.feedbacks.dev/dashboard`,
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
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in failed`,
        description: error.message,
      });
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      setMessage('');

      try {
        const authMethod = isSignUp 
          ? supabase.auth.signUp({ email, password })
          : supabase.auth.signInWithPassword({ email, password });

        const { error, data } = await authMethod;

        if (error) {
          throw error;
        }

        if (isSignUp && !data.session) {
          setMessage('Please check your email to confirm your account!');
          setMessageType('success');
          toast({
            title: 'Account created!',
            description: 'Check your email to confirm your account.',
          });
        } else {
          router.push('/dashboard');
        }
      } catch (error: any) {
        setMessage(error.message);
        setMessageType('error');
        toast({
          variant: 'destructive',
          title: isSignUp ? 'Sign-up failed' : 'Sign-in failed',
          description: error.message,
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="https://www.feedbacks.dev">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="container mx-auto px-4 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-lg bg-background/95 backdrop-blur">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold">
                <Link href="https://www.feedbacks.dev" className="hover:text-primary/80 transition-colors">
                  Welcome to feedbacks.dev
                </Link>
              </CardTitle>
              <CardDescription>
                Sign in to start collecting feedback in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OAuth Providers */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleOAuthAuth('google')}
                  className="w-full gap-2 h-11"
                  variant="outline"
                  type="button"
                >
                  <Chrome className="h-4 w-4" />
                  Continue with Google
                </Button>
                
                <Button
                  onClick={() => handleOAuthAuth('github')}
                  className="w-full gap-2 h-11"
                  variant="outline"
                  type="button"
                >
                  <Github className="h-4 w-4" />
                  Continue with GitHub
                </Button>
                
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or use email
                  </span>
                </div>
              </div>
              
              {/* Toggle between sign in/up */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={!isSignUp ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant={isSignUp ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </Button>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handlePasswordAuth} className="space-y-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full gap-2 h-11" 
                  disabled={isPending || !email.trim() || !password.trim()}
                >
                  {isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      {isSignUp ? 'Create account' : 'Sign in'}
                    </>
                  )}
                </Button>
              </form>
              
              {/* Magic Link Option */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or get a magic link
                  </span>
                </div>
              </div>
              
              <form onSubmit={handleEmailAuth}>
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full gap-2 h-11" 
                  disabled={isPending || !email.trim()}
                >
                  {isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                      Sending magic link...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send magic link to {email || 'email'}
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