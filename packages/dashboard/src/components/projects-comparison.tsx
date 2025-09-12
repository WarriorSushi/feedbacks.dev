"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";

interface ProjectLite { id: string; name: string }

interface Row {
  id: string;
  name: string;
  last30: number;
  avgRating: number | null;
  perDay: number[];
}

export function ProjectsComparison({ projects }: { projects: ProjectLite[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(projects.map(p => p.id));
  const [query, setQuery] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const out: Row[] = [];
    const list = projects.filter(p => selectedIds.includes(p.id));
    await Promise.all(
          list.map(async (p) => {
            try {
              const res = await fetch(`/api/projects/${p.id}/analytics/summary?days=30`, { cache: 'no-store' });
              if (!res.ok) return;
              const j = await res.json();
              out.push({
                id: p.id,
                name: p.name,
                last30: j.lastRange || 0,
                avgRating: typeof j.avgRating === 'number' ? j.avgRating : null,
                perDay: Array.isArray(j.perDay) ? j.perDay.map((d: any) => d.count) : [],
              });
            } catch {}
          })
        );
        // sort by last30 desc
        out.sort((a,b) => b.last30 - a.last30);
        setRows(out);
      } finally {
        setLoading(false);
      }
    };
    if (projects && projects.length) run();
  }, [projects, selectedIds]);

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Comparison</CardTitle>
        <CardDescription>Last 30 days submissions and average rating</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            placeholder="Search projects…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="md:col-span-2 flex flex-wrap gap-2 max-h-24 overflow-auto border rounded p-2">
            {filteredProjects.map(p => (
              <label key={p.id} className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={()=>toggle(p.id)} />
                <span className="truncate max-w-[160px]">{p.name}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="text-xs underline" onClick={()=>setSelectedIds(projects.map(p=>p.id))}>Select all</button>
            <button type="button" className="text-xs underline" onClick={()=>setSelectedIds([])}>Clear</button>
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No data yet.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center border rounded p-2">
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-start gap-2">
                  <div className="font-medium truncate" title={r.name}>{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.last30} in 30d</div>
                </div>
                <div className="sm:col-span-2">
                  <Sparkline data={r.perDay} width={200} height={40} className="w-full" />
                </div>
                <div className="sm:col-span-1 text-sm text-muted-foreground sm:text-right">Avg ★ {r.avgRating ? r.avgRating.toFixed(1) : '—'}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
