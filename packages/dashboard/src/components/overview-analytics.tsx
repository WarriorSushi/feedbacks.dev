"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";

export function OverviewAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null); setData(null);
        const res = await fetch(`/api/analytics/overview?days=${days}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load');
        setData(await res.json());
      } catch (e: any) {
        setError(e.message || 'Error');
      }
    };
    run();
  }, [days]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview Analytics</CardTitle>
        <CardDescription>Across your projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <button className={`px-2 py-1 rounded border text-xs ${days===7?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=>setDays(7)}>7d</button>
          <button className={`px-2 py-1 rounded border text-xs ${days===30?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=>setDays(30)}>30d</button>
          <button className={`px-2 py-1 rounded border text-xs ${days===90?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=>setDays(90)}>90d</button>
        </div>
        {error && <div className="text-sm text-destructive">{error}</div>}
        {!data ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-2xl font-semibold">{data.total}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
              <div className="text-2xl font-semibold">{data.avgRating ? data.avgRating.toFixed(1) : '—'}</div>
            </div>
            <div className="md:col-span-3 space-y-1">
              <div className="text-xs text-muted-foreground">Submissions per day</div>
              <Sparkline data={(data.perDay || []).map((d: any)=>d.count)} width={360} height={56} className="w-full" />
              <div className="text-xs text-muted-foreground">Average rating trend</div>
              <Sparkline data={(data.ratingOverTime || []).map((d: any)=>d.avg || 0)} width={360} height={56} className="w-full" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

