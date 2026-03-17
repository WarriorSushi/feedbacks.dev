import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  const { data } = await supabase
    .from('user_settings')
    .select('anti_spam')
    .eq('user_id', user.id)
    .single();
  return NextResponse.json(data?.anti_spam || {});
}

export async function PUT(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  let body: any = {};
  try { body = await req.json(); if (typeof body !== 'object' || !body) throw new Error('bad'); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  // Upsert
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, anti_spam: body }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'Failed' }, { status: 400 });
  return NextResponse.json({ success: true });
}

