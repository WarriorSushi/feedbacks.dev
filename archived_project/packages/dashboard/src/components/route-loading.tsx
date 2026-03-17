'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface RouteLoadingProps {
  className?: string;
}

export function RouteLoading({ className }: RouteLoadingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Start loading when route changes
    setIsLoading(true);
    setProgress(10);

    // Simulate loading progress
    const progressTimer = setTimeout(() => setProgress(70), 100);
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 800);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div
      className={cn('fixed left-0 right-0 z-50 pointer-events-none', className)}
      style={{ top: 'max(env(safe-area-inset-top, 0px), 0px)' }}
    >
      <Progress
        value={progress}
        className="h-1 bg-transparent border-none"
      />
      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 -translate-y-full">
        <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-full px-3 py-1 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      <div className="relative">
        <div className="w-8 h-8 border-2 border-muted-foreground/20 rounded-full" />
        <div className="absolute top-0 left-0 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl" />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}