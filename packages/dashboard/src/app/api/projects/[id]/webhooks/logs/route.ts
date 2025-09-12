import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(_req.url);
  const endpointId = searchParams.get('endpoint_id') || undefined;
  const event = searchParams.get('event') || undefined;
  const since = searchParams.get('since') || undefined;
  const until = searchParams.get('until') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSizeRaw = Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10) || 25);
  const pageSize = Math.min(100, pageSizeRaw);

  let q = supabase
    .from('webhook_deliveries')
    .select('id,created_at,kind,url,event,status,status_code,error,response_time_ms,endpoint_id', { count: 'exact' })
    .eq('project_id', params.id)
    .order('created_at', { ascending: false });

  if (endpointId) q = q.eq('endpoint_id', endpointId);
  if (event) q = q.eq('event', event);
  if (since) q = q.gte('created_at', new Date(since).toISOString());
  if (until) q = q.lte('created_at', new Date(until).toISOString());

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await q.range(from, to);

  if (error) return NextResponse.json({ items: [], total: 0, page, pageSize });
  return NextResponse.json({ items: data || [], total: count || 0, page, pageSize });
}
