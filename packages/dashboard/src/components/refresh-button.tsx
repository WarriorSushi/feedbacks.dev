"use client";

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RefreshButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => router.refresh()}
      aria-label="Refresh"
      title="Refresh"
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  );
}

