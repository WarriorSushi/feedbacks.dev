import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  // Ensure project exists and is owned by the user
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', params.id)
    .eq('owner_user_id', user.id)
    .single();
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', params.id)
    .eq('owner_user_id', user.id);

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 400 });

  return NextResponse.json({ ok: true });
}

