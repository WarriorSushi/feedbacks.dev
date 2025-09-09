'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { PlatformIntegration } from '@/components/platform-integration';
import { useEffect, useState } from 'react';
import { BottomBar } from '@/components/bottom-bar';

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
        const response = await fetch('/api/auth-status', {
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
    <div className="min-h-screen lovable-gradient flex flex-col">
      {/* Immovable Frosted Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/30 dark:bg-black/30 border-b border-white/20 dark:border-gray-700/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 flex items-center justify-center">
                <img 
                  src="/logo.svg" 
                  alt="Feedbacks.dev Logo" 
                  className="h-8 w-8 rounded-lg"
                />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">feedbacks.dev</span>
              <Badge variant="secondary" className="hidden sm:inline-flex ml-2">
                Beta
              </Badge>
            </Link>
            
            <div className="flex items-center gap-3">
              {authStatus.authenticated ? (
                <>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-300">
                    <a
                      href="https://github.com/WarriorSushi/feedbacks.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-300">
                    <Link href="/docs">Docs</Link>
                  </Button>
                  <Button asChild size="sm" className="premium-button text-xs px-3 py-1 h-8">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-300">
                    <a
                      href="https://github.com/WarriorSushi/feedbacks.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                  <Button variant="ghost" asChild className="hidden sm:inline-flex text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-800/50 transition-all duration-300">
                    <Link href="/docs">Docs</Link>
                  </Button>
                  <Button className="premium-button text-sm px-4" asChild>
                    <Link href="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 pt-16">
        {/* Sticky Corner Controls */}
        <div className="fixed top-20 left-4 z-40">
          <Button variant="ghost" size="sm" asChild className="h-10 w-10 px-0 bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-sm rounded-full">
            <a
              href="https://github.com/WarriorSushi/feedbacks.dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
            >
              <Github className="h-5 w-5 text-gray-900 dark:text-white" />
            </a>
          </Button>
        </div>
        <div className="fixed top-20 right-4 z-40">
          <div className="bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-sm rounded-full p-2">
            <ThemeToggle />
          </div>
        </div>
        {/* Hero Section */}
        <HeroSection isAuthenticated={authStatus.authenticated} />

        {/* Platform Integration */}
        <PlatformIntegration />
        
        {/* Features Section */}
        <FeaturesSection />
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/60 backdrop-blur-sm mt-auto">
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
      <BottomBar />
    </div>
  );
}
