import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import crypto from 'crypto';

async function postJson(url: string, body: any, headers?: Record<string,string>, timeoutMs = 4000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const ms = Date.now() - start;
    const text = await res.text().catch(() => '');
    return { ok: res.ok, status: res.status, bodyText: text?.slice(0, 500) || '', ms };
  } finally {
    clearTimeout(t);
  }
}

export async function POST(_req: NextRequest, { params }: { params: { id: string, deliveryId: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  // Fetch the original delivery (RLS ensures owner can read)
  const { data: row, error } = await supabase
    .from('webhook_deliveries')
    .select('id,project_id,kind,url,event,payload')
    .eq('id', params.deliveryId)
    .eq('project_id', params.id)
    .single();
  if (error || !row) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  // Verify ownership by checking the project owner (defensive; RLS already protects)
  const { data: proj } = await supabase
    .from('projects')
    .select('id,webhooks')
    .eq('id', params.id)
    .eq('owner_user_id', user.id)
    .single();
  if (!proj) return new NextResponse('Unauthorized', { status: 401 });

  try {
    let headers: Record<string, string> | undefined;
    let body: any = row.payload || {};
    if (row.kind === 'generic' && proj.webhooks?.generic?.secret) {
      const ts = Math.floor(Date.now() / 1000).toString();
      const bodyStr = JSON.stringify(body);
      const hmac = crypto.createHmac('sha256', String(proj.webhooks.generic.secret));
      hmac.update(`${ts}.${bodyStr}`);
      headers = {
        'X-Feedbacks-Timestamp': ts,
        'X-Feedbacks-Signature': hmac.digest('hex'),
      };
    }
    // For slack/discord, ensure minimal payload if missing
    if (row.kind === 'slack' && !body?.text) body = { text: 'Resend from feedbacks.dev' };
    if (row.kind === 'discord' && !body?.content) body = { content: 'Resend from feedbacks.dev', username: 'feedbacks.dev' };

    const res = await postJson(row.url, body, headers);

    // Log a new delivery row for this resend
    const { error: insErr } = await supabase
      .from('webhook_deliveries')
      .insert({
        project_id: params.id,
        kind: row.kind,
        url: row.url,
        event: row.event,
        status: res.ok ? 'success' : 'failed',
        status_code: res.status,
        error: res.ok ? null : res.bodyText,
        payload: body,
        response_time_ms: res.ms,
        response_body: res.ok ? null : res.bodyText,
      });
    if (insErr) console.warn('log resend insert error', insErr);

    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed' }, { status: 400 });
  }
}

