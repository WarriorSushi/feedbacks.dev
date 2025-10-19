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
      <CardHeader className="pb-3 md:pb-6">
        <CardTitle className="text-base md:text-lg">Overview Analytics</CardTitle>
        <CardDescription className="text-xs md:text-sm">Across your projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2">
          <button className={`px-3 py-1.5 md:px-2 md:py-1 rounded border text-xs min-h-[44px] md:min-h-0 ${days===7?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=>setDays(7)}>7d</button>
          <button className={`px-3 py-1.5 md:px-2 md:py-1 rounded border text-xs min-h-[44px] md:min-h-0 ${days===30?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=>setDays(30)}>30d</button>
          <button className={`px-3 py-1.5 md:px-2 md:py-1 rounded border text-xs min-h-[44px] md:min-h-0 ${days===90?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=>setDays(90)}>90d</button>
        </div>
        {error && <div className="text-xs md:text-sm text-destructive">{error}</div>}
        {!data ? (
          <div className="text-xs md:text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-xl md:text-2xl font-semibold">{data.total}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg Rating</div>
              <div className="text-xl md:text-2xl font-semibold">{data.avgRating ? data.avgRating.toFixed(1) : '—'}</div>
            </div>
            <div className="col-span-2 md:col-span-3 space-y-2">
              <div className="text-xs text-muted-foreground">Submissions per day</div>
              <Sparkline data={(data.perDay || []).map((d: any)=>d.count)} width={360} height={48} className="w-full h-10 md:h-12" />
              <div className="text-xs text-muted-foreground mt-3">Average rating trend</div>
              <Sparkline data={(data.ratingOverTime || []).map((d: any)=>d.avg || 0)} width={360} height={48} className="w-full h-10 md:h-12" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

