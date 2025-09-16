import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data, error } = await supabase
    .from('projects')
    .select('webhooks')
    .eq('id', params.id)
    .eq('owner_user_id', user.id)
    .single();
  if (error) return NextResponse.json({}, { status: 200 });
  return NextResponse.json(data?.webhooks || {});
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

  // Basic validation: only allow HTTPS webhook URLs when provided
  const checkUrl = (u?: string) => {
    if (!u) return true;
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };
  const invalid: string[] = [];
  // Accept both legacy single-object and new array-based configs
  const checkEndpoints = (arr?: Array<{ url?: string }>, prefix = '') => {
    if (!Array.isArray(arr)) return;
    arr.forEach((e, i) => {
      if (!checkUrl(e?.url)) invalid.push(`${prefix}.endpoints[${i}].url`);
    });
  };
  if (body?.slack?.url && !checkUrl(body.slack.url)) invalid.push('slack.url');
  if (body?.discord?.url && !checkUrl(body.discord.url)) invalid.push('discord.url');
  if (body?.generic?.url && !checkUrl(body.generic.url)) invalid.push('generic.url');
  checkEndpoints(body?.slack?.endpoints, 'slack');
  checkEndpoints(body?.discord?.endpoints, 'discord');
  checkEndpoints(body?.generic?.endpoints, 'generic');
  // Basic GitHub check: ensure repo and token strings if provided
  if (Array.isArray(body?.github?.endpoints)) {
    for (let i=0;i<body.github.endpoints.length;i++) {
      const ep = body.github.endpoints[i];
      if (ep && ((ep.repo && typeof ep.repo !== 'string') || (ep.token && typeof ep.token !== 'string'))) {
        invalid.push(`github.endpoints[${i}]`);
      }
    }
  }
  if (invalid.length) {
    return NextResponse.json({ error: 'Only HTTPS URLs are allowed', fields: invalid }, { status: 400 });
  }

  const { error } = await supabase
    .from('projects')
    .update({ webhooks: body })
    .eq('id', params.id)
    .eq('owner_user_id', user.id);

  if (error) return NextResponse.json({ error: 'Persist failed. Ensure projects.webhooks JSONB exists.' }, { status: 400 });
  return NextResponse.json({ success: true });
}
