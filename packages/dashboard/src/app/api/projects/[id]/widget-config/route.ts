import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data, error } = await supabase
    .from('projects')
    .select('widget_config')
    .eq('id', params.id)
    .eq('owner_user_id', user.id)
    .single();

  if (error) return NextResponse.json({}, { status: 200 });

  return NextResponse.json(data?.widget_config || {});
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  let body: any = {};
  try {
    body = await request.json();
    if (typeof body !== 'object' || body === null) throw new Error('Invalid body');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Attempt update; if column does not exist in DB yet, return helpful message
  const { error } = await supabase
    .from('projects')
    .update({ widget_config: body })
    .eq('id', params.id)
    .eq('owner_user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Persist failed. Ensure projects.widget_config JSONB exists.' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

