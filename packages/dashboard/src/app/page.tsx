'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github } from 'lucide-react';
import { UserMenu } from '@/components/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { useEffect, useState } from 'react';

interface AuthStatus {
  authenticated: boolean;
  email?: string;
}

export default function HomePage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ authenticated: false });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('https://app.feedbacks.dev/api/auth-status', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data: AuthStatus = await response.json();
          setAuthStatus(data);
        } else {
          setAuthStatus({ authenticated: false });
        }
      } catch (error) {
        console.error('Auth status check error:', error);
        setAuthStatus({ authenticated: false });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 flex items-center justify-center">
                  <img 
                    src="/logo.svg" 
                    alt="Feedbacks.dev Logo" 
                    className="h-8 w-8 rounded-lg"
                  />
                </div>
                <span className="font-bold text-lg">feedbacks.dev</span>
              </Link>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Beta
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="h-9 w-9 px-0">
                <a
                  href="https://github.com/feedbacksdev"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
              
              <ThemeToggle />
              
              {authStatus.authenticated ? (
                <>
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <UserMenu user={{ 
                    id: 'user', 
                    email: authStatus.email,
                    user_metadata: {
                      full_name: authStatus.email?.split('@')[0] || 'User'
                    }
                  }} />
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex">
                    <Link href="/docs">Docs</Link>
                  </Button>
                  <Button className="bg-gradient-primary hover:opacity-90" asChild>
                    <Link href="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection isAuthenticated={authStatus.authenticated} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Footer */}
      <footer className="border-t bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  );
}