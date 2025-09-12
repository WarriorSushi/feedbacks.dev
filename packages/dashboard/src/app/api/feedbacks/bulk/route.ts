import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { action, ids, filters } = body || {};
  if (!['mark_read','mark_unread','add_tag','remove_tag','archive','unarchive'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  }

  // Determine target rows: either explicit ids or by filter.
  let targetIds: string[] = Array.isArray(ids) ? ids : [];
  if (!targetIds.length) {
    // Build filter query across user's projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_user_id', user.id);
    const pids = (projects || []).map((p: any) => p.id);
    if (!pids.length) return NextResponse.json({ ok: true, count: 0 });

    let q = supabaseAdmin.from('feedback').select('id,project_id');
    if (filters?.projectId) q = q.eq('project_id', filters.projectId);
    else q = q.in('project_id', pids);
    if (filters?.status && filters.status !== 'all') q = q.eq('is_read', filters.status === 'read');
    if (filters?.type && filters.type !== 'all') q = q.eq('type', filters.type);
    if (filters?.rating && filters.rating !== 'all') q = q.eq('rating', Number(filters.rating));
    if (filters?.searchTerm) {
      const term = `%${String(filters.searchTerm).trim()}%`;
      q = q.or(`message.ilike.${term},email.ilike.${term}`);
    }
    const { data } = await q;
    targetIds = (data || []).map((r: any) => r.id);
  }

  if (!targetIds.length) return NextResponse.json({ ok: true, count: 0 });

  // For updates requiring tag transforms, fetch current tags
  let tagMap: Record<string, string[] | null> = {};
  if (action === 'add_tag' || action === 'remove_tag') {
    const { data } = await supabaseAdmin.from('feedback').select('id,tags').in('id', targetIds);
    (data || []).forEach((r: any) => { tagMap[r.id] = Array.isArray(r.tags) ? r.tags : []; });
  }

  const addTag = (filters?.tag || '').trim();
  const removeTag = (filters?.tag || '').trim();

  for (const id of targetIds) {
    const updates: any = {};
    if (action === 'mark_read') updates.is_read = true;
    if (action === 'mark_unread') updates.is_read = false;
    if (action === 'archive') updates.archived = true;
    if (action === 'unarchive') updates.archived = false;
    if (action === 'add_tag' && addTag) {
      const cur = tagMap[id] || [];
      updates.tags = Array.from(new Set([...cur, addTag]));
    }
    if (action === 'remove_tag' && removeTag) {
      const cur = tagMap[id] || [];
      updates.tags = cur.filter((t) => t !== removeTag);
    }
    if (Object.keys(updates).length === 0) continue;
    await supabaseAdmin.from('feedback').update(updates).eq('id', id);
    // Emit updated event for each row
    await fetch(`${process.env.APP_BASE_URL || 'https://app.feedbacks.dev'}/api/feedbacks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      is_read: updates.is_read,
      add_tag: action === 'add_tag' ? addTag : undefined,
      remove_tag: action === 'remove_tag' ? removeTag : undefined,
      archived: updates.archived,
    }) }).catch(()=>{});
  }

  return NextResponse.json({ ok: true, count: targetIds.length });
}

