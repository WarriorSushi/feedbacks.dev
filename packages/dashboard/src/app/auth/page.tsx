'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Github, Mail, ArrowLeft, Chrome, Key } from 'lucide-react';
import Link from 'next/link';
import { BottomBar } from '@/components/bottom-bar';

type CaptchaProvider = 'turnstile' | 'hcaptcha';

interface CaptchaConfig {
  provider: CaptchaProvider | null;
  siteKey: string | null;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    hcaptcha?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string | number) => void;
      remove?: (widgetId: string | number) => void;
    };
  }
}

const rawCaptchaProvider = process.env.NEXT_PUBLIC_SUPABASE_CAPTCHA_PROVIDER?.toLowerCase();
const explicitCaptchaProvider: CaptchaProvider | null =
  rawCaptchaProvider === 'turnstile' || rawCaptchaProvider === 'hcaptcha'
    ? (rawCaptchaProvider as CaptchaProvider)
    : null;
const disableCaptcha = rawCaptchaProvider === 'none';
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

const captchaConfig: CaptchaConfig = (() => {
  if (disableCaptcha) {
    return { provider: null, siteKey: null };
  }

  if (explicitCaptchaProvider === 'turnstile') {
    return { provider: 'turnstile', siteKey: turnstileSiteKey ?? null };
  }

  if (explicitCaptchaProvider === 'hcaptcha') {
    return { provider: 'hcaptcha', siteKey: hcaptchaSiteKey ?? null };
  }

  if (turnstileSiteKey) {
    return { provider: 'turnstile', siteKey: turnstileSiteKey };
  }

  if (hcaptchaSiteKey) {
    return { provider: 'hcaptcha', siteKey: hcaptchaSiteKey };
  }

  return { provider: null, siteKey: null };
})();

interface CaptchaChallengeProps {
  provider: CaptchaProvider;
  siteKey: string;
  onToken: (token: string | null) => void;
  onResetRef: (resetFn: (() => void) | null) => void;
}

function CaptchaChallenge({ provider, siteKey, onToken, onResetRef }: CaptchaChallengeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | number | null>(null);
  const scriptLoadHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onToken(null);

    const container = containerRef.current;
    if (!container) {
      return;
    }

    let isUnmounted = false;

    const renderCaptcha = () => {
      if (!containerRef.current || isUnmounted) {
        return;
      }

      if (provider === 'turnstile') {
        const turnstile = window.turnstile;
        if (!turnstile) {
          return;
        }

        if (widgetIdRef.current !== null) {
          turnstile.remove(widgetIdRef.current as string);
          widgetIdRef.current = null;
        }

        const widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          'error-callback': () => onToken(null),
          'timeout-callback': () => {
            onToken(null);
            if (widgetIdRef.current) {
              turnstile.reset(widgetIdRef.current as string);
            }
          },
          'expired-callback': () => {
            onToken(null);
            if (widgetIdRef.current) {
              turnstile.reset(widgetIdRef.current as string);
            }
          },
        });

        widgetIdRef.current = widgetId;
        onResetRef(() => {
          if (widgetIdRef.current) {
            turnstile.reset(widgetIdRef.current as string);
          }
          onToken(null);
        });
      } else {
        const hcaptcha = window.hcaptcha;
        if (!hcaptcha) {
          return;
        }

        if (widgetIdRef.current !== null) {
          hcaptcha.reset(widgetIdRef.current);
          hcaptcha.remove?.(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        const widgetId = hcaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          'error-callback': () => onToken(null),
          'expired-callback': () => {
            onToken(null);
            if (widgetIdRef.current !== null) {
              hcaptcha.reset(widgetIdRef.current);
            }
          },
        });

        widgetIdRef.current = widgetId;
        onResetRef(() => {
          if (widgetIdRef.current !== null) {
            hcaptcha.reset(widgetIdRef.current);
          }
          onToken(null);
        });
      }
    };

    const scriptSrc =
      provider === 'turnstile'
        ? 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
        : 'https://js.hcaptcha.com/1/api.js?render=explicit';

    const attachLoadListener = (script: HTMLScriptElement) => {
      const handler = () => {
        renderCaptcha();
      };
      scriptLoadHandlerRef.current = handler;
      script.addEventListener('load', handler);
    };

    const scripts = Array.from(document.scripts) as HTMLScriptElement[];
    const existingScript = scripts.find((script) => script.src === scriptSrc);

    if (existingScript) {
      const ready =
        (provider === 'turnstile' && window.turnstile) ||
        (provider === 'hcaptcha' && window.hcaptcha);

      if (ready) {
        renderCaptcha();
      } else {
        attachLoadListener(existingScript);
      }
    } else {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        renderCaptcha();
      };
      document.body.appendChild(script);
    }

    return () => {
      isUnmounted = true;
      onResetRef(null);

      if (scriptLoadHandlerRef.current && existingScript) {
        existingScript.removeEventListener('load', scriptLoadHandlerRef.current);
      }

      if (provider === 'turnstile') {
        const turnstile = window.turnstile;
        if (turnstile && widgetIdRef.current) {
          turnstile.remove(widgetIdRef.current as string);
        }
      } else {
        const hcaptcha = window.hcaptcha;
        if (hcaptcha && widgetIdRef.current !== null) {
          hcaptcha.remove?.(widgetIdRef.current);
        }
      }

      widgetIdRef.current = null;
      scriptLoadHandlerRef.current = null;
    };
  }, [provider, siteKey, onToken, onResetRef]);

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className="flex justify-center" />
    </div>
  );
}

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaResetRef = useRef<(() => void) | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createBrowserSupabaseClient();
  const requiresCaptcha =
    isSignUp && captchaConfig.provider !== null && Boolean(captchaConfig.siteKey);
  const captchaUnavailable =
    isSignUp && captchaConfig.provider !== null && !captchaConfig.siteKey;

  const handleCaptchaToken = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaResetRef = useCallback((resetFn: (() => void) | null) => {
    captchaResetRef.current = resetFn;
  }, []);

  useEffect(() => {
    if (!requiresCaptcha) {
      setCaptchaToken(null);
      captchaResetRef.current = null;
    }
  }, [requiresCaptcha]);

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Check if we're here to sign out
        const urlParams = new URLSearchParams(window.location.search);
        const shouldSignOut = urlParams.get('signout') === 'true';
        
        if (shouldSignOut) {
          // Clear server-side session
          const serverSignOutResponse = await fetch('/api/sign-out', { 
            method: 'POST',
            credentials: 'include'
          });
          
          // Clear client-side session
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('Client sign-out error:', error);
          }
          
          // Remove the signout parameter from URL
          window.history.replaceState({}, document.title, '/auth');
          
          toast({
            title: "Signed out successfully",
            description: "You have been signed out of your account.",
          });
          
          return; // Don't check for user after sign out
        }
        
        // Add timeout protection
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 2000)
        );
        
        const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;
        
        if (user) {
          router.push('/dashboard');
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

  const handleOAuthAuth = async (provider: 'github' | 'google' | 'discord') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
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
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in failed`,
        description: error.message,
      });
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (captchaUnavailable) {
      const description = 'Sign-ups are temporarily unavailable. Please contact support.';
      setMessage(description);
      setMessageType('error');
      toast({
        variant: 'destructive',
        title: 'Sign-up unavailable',
        description,
      });
      return;
    }

    if (requiresCaptcha && !captchaToken) {
      const description = 'Please complete the captcha challenge before creating an account.';
      setMessage(description);
      setMessageType('error');
      toast({
        variant: 'destructive',
        title: 'Captcha required',
        description,
      });
      return;
    }

    startTransition(async () => {
      setMessage('');

      try {
        const authMethod = isSignUp
          ? supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                captchaToken: requiresCaptcha ? captchaToken || undefined : undefined,
              },
            })
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
          if (requiresCaptcha) {
            captchaResetRef.current?.();
            setCaptchaToken(null);
          }
        } else {
          if (requiresCaptcha) {
            captchaResetRef.current?.();
            setCaptchaToken(null);
          }
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
        if (requiresCaptcha) {
          captchaResetRef.current?.();
          setCaptchaToken(null);
        }
      }
    });
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

                {requiresCaptcha && captchaConfig.provider && captchaConfig.siteKey && (
                  <div className="space-y-2 rounded-md border border-border/60 bg-muted/40 p-3">
                    <CaptchaChallenge
                      provider={captchaConfig.provider}
                      siteKey={captchaConfig.siteKey}
                      onToken={handleCaptchaToken}
                      onResetRef={handleCaptchaResetRef}
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      Protected by {captchaConfig.provider === 'turnstile' ? 'Cloudflare Turnstile' : 'hCaptcha'}.
                    </p>
                  </div>
                )}

                {captchaUnavailable && (
                  <p className="text-xs text-destructive">
                    Sign-ups are temporarily unavailable. Please contact support.
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2 h-11"
                  disabled={
                    isPending ||
                    !email.trim() ||
                    !password.trim() ||
                    (requiresCaptcha && !captchaToken) ||
                    captchaUnavailable
                  }
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
      <BottomBar />
    </div>
  );
}
