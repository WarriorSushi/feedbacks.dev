import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // RLS ensures user can only read their project's feedback
  const { data, error } = await supabase
    .from('feedback')
    .select('created_at,message,email,url,user_agent,type,rating,priority,tags,screenshot_url,attachments')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return new NextResponse('Error generating CSV', { status: 500 });
  }

  const header = ['created_at','message','email','url','user_agent','type','rating','priority','tags','screenshot_url','attachments'];
  const rows = (data || []).map((r: any) => [
    r.created_at,
    (r.message || '').replace(/"/g, '""'),
    r.email || '',
    r.url || '',
    (r.user_agent || '').replace(/"/g, '""'),
    r.type || '',
    r.rating?.toString() || '',
    r.priority || '',
    Array.isArray(r.tags) ? r.tags.join('|') : '',
    r.screenshot_url || '',
    r.attachments ? JSON.stringify(r.attachments) : ''
  ]);

  const csv = [
    header.join(','),
    ...rows.map(cols => cols.map(c => `"${String(c)}"`).join(','))
  ].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=feedback-${params.id}.csv`
    }
  });
}
