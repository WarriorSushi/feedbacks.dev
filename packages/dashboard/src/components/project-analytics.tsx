"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/ui/sparkline";

export function ProjectAnalytics({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<number>(7);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        setData(null);
        const res = await fetch(`/api/projects/${projectId}/analytics/summary?days=${days}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load analytics');
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || 'Error');
      }
    };
    run();
  }, [projectId, days]);

  if (error) return <div className="text-sm text-destructive">{error}</div>;
  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      {/* Range selector */}
      <div className="flex items-center gap-2">
        <button className={`px-2 py-1 rounded border text-xs ${days===7?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=>setDays(7)}>7d</button>
        <button className={`px-2 py-1 rounded border text-xs ${days===30?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=>setDays(30)}>30d</button>
        <button className={`px-2 py-1 rounded border text-xs ${days===90?'bg-primary text-primary-foreground':'bg-background'}`} onClick={()=>setDays(90)}>90d</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded border">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-xl font-semibold">{data.total}</div>
        </div>
        <div className="p-3 rounded border">
          <div className="text-xs text-muted-foreground">Last 7 Days</div>
          <div className="text-xl font-semibold">{data.last7}</div>
        </div>
        <div className="p-3 rounded border">
          <div className="text-xs text-muted-foreground">Avg Rating</div>
          <div className="text-xl font-semibold">{data.avgRating ? data.avgRating.toFixed(1) : '—'}</div>
        </div>
        <div className="p-3 rounded border">
          <div className="text-xs text-muted-foreground">By Type</div>
          <div className="flex gap-1 mt-1 flex-wrap">
            <Badge variant="outline" className="text-xs">Bug: {data.byType?.bug || 0}</Badge>
            <Badge variant="outline" className="text-xs">Idea: {data.byType?.idea || 0}</Badge>
            <Badge variant="outline" className="text-xs">Praise: {data.byType?.praise || 0}</Badge>
          </div>
        </div>
      </div>

      {Array.isArray(data.perDay) && data.perDay.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Per Day</div>
          <Sparkline data={data.perDay.map((d: any) => d.count)} width={260} height={56} className="w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {data.perDay.map((d: any) => (
              <div key={d.date} className="p-2 rounded border text-xs text-muted-foreground">
                <div>{d.date}</div>
                <div className="text-foreground font-medium">{d.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Type (stacked bars per day) */}
      {data.perDayByType && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Per Day by Type</div>
          <div className="flex gap-2 overflow-x-auto">
            {data.perDay.map((d: any) => {
              const bug = data.perDayByType.bug.find((x: any) => x.date === d.date)?.count || 0;
              const idea = data.perDayByType.idea.find((x: any) => x.date === d.date)?.count || 0;
              const praise = data.perDayByType.praise.find((x: any) => x.date === d.date)?.count || 0;
              const total = Math.max(1, bug + idea + praise);
              const h = 80;
              const bugH = (bug / total) * h;
              const ideaH = (idea / total) * h;
              const praiseH = (praise / total) * h;
              return (
                <div key={d.date} className="flex flex-col items-center min-w-[28px]">
                  <div className="flex flex-col justify-end h-20 w-4 rounded bg-muted overflow-hidden">
                    <div className="bg-green-500/60" style={{ height: `${praiseH}px` }} />
                    <div className="bg-primary/50" style={{ height: `${ideaH}px` }} />
                    <div className="bg-destructive" style={{ height: `${bugH}px` }} />
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">{d.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 bg-destructive inline-block rounded"></span> Bug</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 bg-primary/50 inline-block rounded"></span> Idea</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 bg-green-500/60 inline-block rounded"></span> Praise</span>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {data.ratingCounts && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Rating Distribution</div>
          <div className="flex items-end gap-2 h-24">
            {['1','2','3','4','5'].map((r) => {
              const v = data.ratingCounts[r] || 0;
              const max = Math.max(...Object.values(data.ratingCounts));
              const h = max ? (v / max) * 80 + 8 : 8;
              return (
                <div key={r} className="flex flex-col items-center">
                  <div className="w-6 rounded bg-primary/60" style={{ height: `${h}px` }} />
                  <div className="mt-1 text-xs text-muted-foreground">{r}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rating over time */}
      {data.ratingOverTime && data.ratingOverTime.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Average Rating Over Time</div>
          <Sparkline data={data.ratingOverTime.map((d: any) => d.avg || 0)} width={260} height={56} className="w-full" />
        </div>
      )}

      {/* Tag Heatmap */}
      {data.tagHeatmap && data.tagHeatmap.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Top Tags Heatmap</div>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${data.perDay.length}, minmax(16px, 1fr))` }}>
              {/* header row */}
              {data.perDay.map((d: any) => (
                <div key={`h-${d.date}`} className="text-[10px] text-muted-foreground text-center">{d.date.slice(5)}</div>
              ))}
              {(() => {
                // matrix: tags x dates
                const tags = Array.from(new Set(data.tagHeatmap.map((x: any) => x.tag)));
                const maxVal = Math.max(...data.tagHeatmap.map((x: any) => x.count));
                return tags.map((tag: string) => (
                  <React.Fragment key={tag}>
                    {data.perDay.map((d: any) => {
                      const cell = data.tagHeatmap.find((x: any) => x.tag === tag && x.date === d.date);
                      const v = cell?.count || 0;
                      const alpha = maxVal ? (0.2 + 0.8 * (v / maxVal)) : 0;
                      return <div key={`${tag}-${d.date}`} title={`${tag}: ${v}`} className="h-4 w-4 rounded" style={{ backgroundColor: v ? `hsla(var(--primary), ${alpha})` : 'transparent', border: '1px solid hsl(var(--border))' }} />;
                    })}
                  </React.Fragment>
                ));
              })()}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Darker cells = higher frequency of tag on that day.</div>
        </div>
      )}
    </div>
  );
}
