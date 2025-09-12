import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = params.id;
  const url = new URL(req.url);
  const daysParam = parseInt(url.searchParams.get('days') || '7', 10);
  const days = [7, 30, 90].includes(daysParam) ? daysParam : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const countHead = async (filters: (q: any) => any) => {
    let q = supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
    q = filters(q);
    const { count } = await q;
    return count || 0;
  };

  // Totals
  const total = await countHead(q => q);
  const lastRange = await countHead(q => q.gte('created_at', since));
  const bug = await countHead(q => q.eq('type', 'bug'));
  const idea = await countHead(q => q.eq('type', 'idea'));
  const praise = await countHead(q => q.eq('type', 'praise'));

  // Avg rating (last 200)
  const { data: recentRatings } = await supabase
    .from('feedback')
    .select('rating')
    .eq('project_id', projectId)
    .not('rating', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);
  const ratings = (recentRatings || []).map((r: any) => r.rating).filter((n: any) => typeof n === 'number');
  const avgRating = ratings.length ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : null;

  // Per-day counts (last 7 days) and by type
  const { data: lastRows } = await supabase
    .from('feedback')
    .select('created_at,type,rating,tags')
    .eq('project_id', projectId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  const perDayMap = new Map<string, number>();
  const perDayTypeMap: Record<string, Map<string, number>> = { bug: new Map(), idea: new Map(), praise: new Map() };
  const ratingSumMap = new Map<string, { sum: number; count: number }>();
  const tagCountsTotal = new Map<string, number>();
  (lastRows || []).forEach((r: any) => {
    const d = new Date(r.created_at);
    const key = d.toISOString().slice(0, 10);
    perDayMap.set(key, (perDayMap.get(key) || 0) + 1);
    const t = (r.type || '').toLowerCase();
    if (t && perDayTypeMap[t as 'bug'|'idea'|'praise']) {
      const m = perDayTypeMap[t as 'bug'|'idea'|'praise'];
      m.set(key, (m.get(key) || 0) + 1);
    }
    const rating = Number(r.rating);
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      const agg = ratingSumMap.get(key) || { sum: 0, count: 0 };
      agg.sum += rating; agg.count += 1; ratingSumMap.set(key, agg);
    }
    if (Array.isArray(r.tags)) {
      for (const tg of r.tags) {
        const k = String(tg).trim().toLowerCase();
        if (k) tagCountsTotal.set(k, (tagCountsTotal.get(k) || 0) + 1);
      }
    }
  });
  const perDay = Array.from(perDayMap.entries()).map(([date, count]) => ({ date, count }));
  const perDayByType = {
    bug: Array.from(perDayTypeMap.bug.entries()).map(([date, count]) => ({ date, count })),
    idea: Array.from(perDayTypeMap.idea.entries()).map(([date, count]) => ({ date, count })),
    praise: Array.from(perDayTypeMap.praise.entries()).map(([date, count]) => ({ date, count })),
  };
  const ratingOverTime = Array.from(ratingSumMap.entries()).map(([date, v]) => ({ date, avg: v.count ? v.sum / v.count : null }));

  // Tag heatmap: pick top 5 tags
  const topTags = Array.from(tagCountsTotal.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([tag])=>tag);
  const tagHeatmap: Array<{ tag: string; date: string; count: number }> = [];
  if (topTags.length > 0) {
    const tagDayMap: Record<string, Map<string, number>> = {};
    topTags.forEach(t => tagDayMap[t] = new Map());
    (lastRows || []).forEach((r: any) => {
      const day = new Date(r.created_at).toISOString().slice(0,10);
      if (Array.isArray(r.tags)) {
        for (const tg of r.tags) {
          const k = String(tg).trim().toLowerCase();
          if (tagDayMap[k]) {
            const m = tagDayMap[k]; m.set(day, (m.get(day) || 0) + 1);
          }
        }
      }
    });
    for (const t of topTags) {
      for (const [d, c] of tagDayMap[t].entries()) {
        tagHeatmap.push({ tag: t, date: d, count: c });
      }
    }
  }

  // Rating histogram (last 1000 rows)
  const { data: ratingRows } = await supabase
    .from('feedback')
    .select('rating')
    .eq('project_id', projectId)
    .not('rating', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1000);
  const ratingCounts: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  (ratingRows || []).forEach((r: any) => {
    const v = Number(r.rating);
    if (v >= 1 && v <= 5) ratingCounts[String(v)]++;
  });

  return NextResponse.json({
    total,
    lastRange,
    byType: { bug, idea, praise },
    avgRating,
    perDay,
    perDayByType,
    ratingCounts,
    ratingOverTime,
    tagHeatmap,
    days,
  });
}
