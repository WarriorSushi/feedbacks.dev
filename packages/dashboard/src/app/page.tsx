'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeSnippet } from '@/components/code-snippet';
import { Zap, Code, Rocket, Github, ArrowRight } from 'lucide-react';
import { UserMenu } from '@/components/user-menu';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const supabase = createClient();
    
    // Premium approach: Listen to auth state changes + initial check
    const checkAuth = async () => {
      try {
        // First check session from localStorage (instant)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          setIsLoading(false);
          return;
        }
        
        // Fallback: Check user from server (with timeout)
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;
        setUser(user);
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Listen for auth state changes (premium feature)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  const sampleCode = `<script 
  src="https://cdn.feedbacks.dev/widget-1.0.0.js"
  data-project="pk_live_abc123"
  defer>
</script>`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-primary">feedbacks.dev</h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Beta
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <>
                  <Button variant="ghost" className="hidden sm:inline-flex" disabled>
                    <div className="h-4 w-8 bg-muted-foreground/20 animate-pulse rounded" />
                  </Button>
                  <Button disabled>
                    <div className="h-4 w-16 bg-background/20 animate-pulse rounded" />
                  </Button>
                </>
              ) : user ? (
                <>
                  <Button asChild>
                    <Link href="https://app.feedbacks.dev/dashboard">Go to Dashboard</Link>
                  </Button>
                  <UserMenu user={user} />
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex">
                    <Link href="/docs">Docs</Link>
                  </Button>
                  <Button asChild>
                    <Link href="https://app.feedbacks.dev/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            Collect feedback with one line of code
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance mb-6">
            Premium feedback widget for{' '}
            <span className="text-primary bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              modern developers
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Add a beautiful, responsive feedback widget to your website or app in seconds. 
            No bloated scripts, no complex setup, just simple feedback collection.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isLoading ? (
              <Button size="lg" disabled className="flex items-center">
                <div className="h-4 w-24 bg-background/20 animate-pulse rounded" />
                <ArrowRight className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            ) : (
              <Button size="lg" asChild>
                {user ? (
                  <Link href="https://app.feedbacks.dev/dashboard" className="flex items-center">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <Link href="https://app.feedbacks.dev/auth" className="flex items-center">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                )}
              </Button>
            )}
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com/feedbacks-dev" className="flex items-center">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Link>
            </Button>
          </div>

          {/* Code Example */}
          <div className="max-w-2xl mx-auto">
            <CodeSnippet code={sampleCode} />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                Lightning Fast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Under 20KB gzipped. Loads in under 100ms globally with our CDN.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 text-blue-500 mr-2" />
                Developer First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Simple API, clear docs, TypeScript support. Works with any framework.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Rocket className="h-5 w-5 text-purple-500 mr-2" />
                Mobile Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Responsive design, touch-friendly, works perfectly on all devices.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <p className="text-sm text-muted-foreground">
                  © 2025 feedbacks.dev. All rights reserved.
                </p>
              </div>
              <div className="flex items-center space-x-6">
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link href="mailto:support@feedbacks.dev" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}