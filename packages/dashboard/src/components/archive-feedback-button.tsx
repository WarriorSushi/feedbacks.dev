"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Archive } from 'lucide-react';

export function ArchiveFeedbackButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const onClick = async () => {
    try {
      setLoading(true);
      await fetch(`/api/feedbacks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });
      router.refresh();
    } catch {
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={loading} className="gap-1">
      <Archive className="h-3 w-3" />
      {loading ? 'Archiving…' : 'Archive'}
    </Button>
  );
}

