import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const daysParam = parseInt(url.searchParams.get('days') || '30', 10);
  const days = [7, 30, 90].includes(daysParam) ? daysParam : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Get user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_user_id', user.id);
  const ids = (projects || []).map((p: any) => p.id);
  if (ids.length === 0) {
    return NextResponse.json({ days, total: 0, avgRating: null, perDay: [], ratingOverTime: [] });
  }

  // Fetch feedback
  const { data: rows } = await supabase
    .from('feedback')
    .select('created_at,rating')
    .in('project_id', ids)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  const perDayMap = new Map<string, number>();
  const ratingMap = new Map<string, { sum: number; count: number }>();
  let globalSum = 0, globalCount = 0;
  (rows || []).forEach((r: any) => {
    const day = new Date(r.created_at).toISOString().slice(0,10);
    perDayMap.set(day, (perDayMap.get(day) || 0) + 1);
    const val = Number(r.rating);
    if (!isNaN(val) && val >= 1 && val <= 5) {
      const agg = ratingMap.get(day) || { sum: 0, count: 0 };
      agg.sum += val; agg.count += 1; ratingMap.set(day, agg);
      globalSum += val; globalCount += 1;
    }
  });
  const perDay = Array.from(perDayMap.entries()).map(([date, count]) => ({ date, count }));
  const ratingOverTime = Array.from(ratingMap.entries()).map(([date, v]) => ({ date, avg: v.count ? v.sum / v.count : null }));
  const avgRating = globalCount ? (globalSum / globalCount) : null;

  return NextResponse.json({ days, total: (rows || []).length, avgRating, perDay, ratingOverTime });
}

