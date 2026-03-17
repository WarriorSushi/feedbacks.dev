"use client";

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

export function RefreshButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => {
        startRefresh(() => {
          router.refresh();
        });
      }}
      aria-label="Refresh"
      title="Refresh"
      aria-busy={isRefreshing}
    >
      <RefreshCw className={cn('h-4 w-4 transition-transform', isRefreshing && 'animate-spin')} />
    </Button>
  );
}

