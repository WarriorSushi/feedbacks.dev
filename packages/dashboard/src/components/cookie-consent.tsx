'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthAndConsent = async () => {
      try {
        // Reset cookie consent for everyone (fresh start)
        localStorage.removeItem('cookie-consent');
        
        // Check if user is authenticated
        const supabase = createClient();
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 1000)
        );
        
        const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;
        
        if (user) {
          // User is signed in - assume cookie consent (like major sites)
          localStorage.setItem('cookie-consent', JSON.stringify({
            choice: 'accepted',
            timestamp: Date.now(),
            reason: 'authenticated-user'
          }));
          setIsVisible(false);
        } else {
          // User not signed in - show cookie banner
          setIsVisible(true);
        }
      } catch (error) {
        // If auth check fails, show cookie banner
        setIsVisible(true);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthAndConsent();
  }, []);

  const acceptCookies = () => {
    try {
      localStorage.setItem('cookie-consent', JSON.stringify({
        choice: 'accepted',
        timestamp: Date.now()
      }));
    } catch (error) {
      // Handle localStorage errors gracefully
    }
    setIsVisible(false);
  };

  const declineCookies = () => {
    try {
      localStorage.setItem('cookie-consent', JSON.stringify({
        choice: 'declined',
        timestamp: Date.now()
      }));
    } catch (error) {
      // Handle localStorage errors gracefully
    }
    setIsVisible(false);
  };

  // Don't show banner while checking auth or if not visible
  if (isCheckingAuth || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="border shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium mb-1">We use cookies</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    We use cookies to improve your experience and for authentication across subdomains. 
                    {' '}
                    <Link href="/privacy" className="underline hover:text-primary">
                      Learn more
                    </Link>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={declineCookies}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={acceptCookies}
                  className="h-7 px-3 text-xs"
                >
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={declineCookies}
                  className="h-7 px-3 text-xs"
                >
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}