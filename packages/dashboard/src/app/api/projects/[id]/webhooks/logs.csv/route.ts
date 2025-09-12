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
  const limit = Math.min(5000, Math.max(1, parseInt(searchParams.get('limit') || '1000', 10) || 1000));

  let q = supabase
    .from('webhook_deliveries')
    .select('created_at,endpoint_id,kind,event,status,status_code,response_time_ms,url,error')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (endpointId) q = q.eq('endpoint_id', endpointId);
  if (event) q = q.eq('event', event);
  if (since) q = q.gte('created_at', new Date(since).toISOString());
  if (until) q = q.lte('created_at', new Date(until).toISOString());

  const { data, error } = await q;
  if (error) return new NextResponse('Failed', { status: 500 });

  const rows = (data || []) as any[];
  const headers = ['created_at','endpoint_id','kind','event','status','status_code','response_time_ms','url','error'];
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
    const v = r[h];
    const s = (v === null || v === undefined) ? '' : String(v);
    const escaped = '"' + s.replace(/"/g, '""') + '"';
    return escaped;
  }).join(','))).join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="webhook_logs.csv"',
    }
  });
}

