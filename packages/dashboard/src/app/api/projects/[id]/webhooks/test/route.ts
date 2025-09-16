import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import crypto from 'crypto';

async function postJson(url: string, body: any, headers?: Record<string,string>, timeoutMs = 4000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const urlObj = new URL(request.url);
  const kind = urlObj.searchParams.get('kind');
  const endpointId = urlObj.searchParams.get('endpoint');
  const { data: proj } = await supabase.from('projects').select('name,webhooks').eq('id', params.id).eq('owner_user_id', user.id).single();
  const name = proj?.name || 'Project';
  const cfg = proj?.webhooks || {};
  const text = `feedbacks.dev test webhook for ${name}`;

  try {
    const findEndpoint = (arr?: any[]) => (Array.isArray(arr) ? (endpointId ? arr.find(e => e?.id === endpointId) : arr[0]) : undefined);
    if (kind === 'slack') {
      const ep = findEndpoint(cfg?.slack?.endpoints) || (cfg.slack?.url ? { url: cfg.slack.url, enabled: cfg.slack.enabled } : undefined);
      if (!ep?.enabled || !ep?.url) return NextResponse.json({ ok: false, error: 'Not configured' }, { status: 400 });
      const r = await postJson(ep.url, { text });
      return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 400 });
    }
    if (kind === 'discord') {
      const ep = findEndpoint(cfg?.discord?.endpoints) || (cfg.discord?.url ? { url: cfg.discord.url, enabled: cfg.discord.enabled } : undefined);
      if (!ep?.enabled || !ep?.url) return NextResponse.json({ ok: false, error: 'Not configured' }, { status: 400 });
      const r = await postJson(ep.url, { content: text, username: 'feedbacks.dev' });
      return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 400 });
    }
    if (kind === 'generic') {
      // Support arrays and legacy
      const ep = findEndpoint(cfg?.generic?.endpoints) || (cfg.generic?.url ? { url: cfg.generic.url, enabled: cfg.generic.enabled, secret: cfg.generic.secret } : undefined);
      if (!ep?.enabled || !ep?.url) return NextResponse.json({ ok: false, error: 'Not configured' }, { status: 400 });
      const payload = { type: 'test', source: 'feedbacks.dev', project: name, at: new Date().toISOString() };
      // Sign the request if secret present
      const headers: Record<string, string> = {};
      if (ep?.secret) {
        const ts = Math.floor(Date.now() / 1000).toString();
        const bodyStr = JSON.stringify(payload);
        const hmac = crypto.createHmac('sha256', String(ep.secret));
        hmac.update(`${ts}.${bodyStr}`);
        headers['X-Feedbacks-Timestamp'] = ts;
        headers['X-Feedbacks-Signature'] = hmac.digest('hex');
      }
      const r = await postJson(ep.url, payload, headers);
      return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 400 });
    }
    if (kind === 'github') {
      const ep = (() => {
        const arr = Array.isArray(cfg?.github?.endpoints) ? cfg.github.endpoints : [];
        return endpointId ? arr.find((e:any)=>e?.id===endpointId) : arr[0];
      })();
      if (!ep?.enabled || !ep?.repo || !ep?.token) return NextResponse.json({ ok: false, error: 'Not configured' }, { status: 400 });
      const url = `https://api.github.com/repos/${ep.repo}/issues`;
      const headers = {
        'Authorization': `Bearer ${ep.token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'feedbacks.dev'
      } as Record<string,string>;
      const payload = { title: `feedbacks.dev test webhook for ${name}`, body: `This is a test issue created at ${new Date().toISOString()}`, labels: ['feedbacks-dev'] };
      const r = await postJson(url, payload, headers);
      return NextResponse.json({ ok: r.ok }, { status: r.ok ? 200 : 400 });
    }
    return NextResponse.json({ ok: false, error: 'Webhook not configured or enabled' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Failed' }, { status: 400 });
  }
}
