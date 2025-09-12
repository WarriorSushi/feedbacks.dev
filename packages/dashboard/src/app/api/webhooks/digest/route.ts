import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function POST(_req: NextRequest) {
  // Optional shared secret to protect this route
  const urlObj = new URL(_req.url);
  const provided = _req.headers.get('x-cron-secret') || urlObj.searchParams.get('secret');
  const secret = process.env.CRON_SECRET;
  if (secret && provided !== secret) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // last hour
  const until = new Date().toISOString();
  const APP_BASE_URL = process.env.APP_BASE_URL || 'https://app.feedbacks.dev';

  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('id,name,webhooks');

  for (const p of (projects || [])) {
    const cfg = (p as any).webhooks || {};
    const toArray = (x: any) => (Array.isArray(x) ? x : []);
    const makeId = (url: string) => 'u-' + crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);

    type EP = { id: string; url: string; enabled: boolean; delivery?: 'immediate'|'digest'; digestInterval?: 'hourly'; rules?: any; secret?: string; events?: string[] };
    const slack: EP[] = cfg?.slack?.endpoints ? toArray(cfg.slack.endpoints) : (cfg?.slack?.url ? [{ url: cfg.slack.url, enabled: cfg.slack.enabled }] : []);
    const discord: EP[] = cfg?.discord?.endpoints ? toArray(cfg.discord.endpoints) : (cfg?.discord?.url ? [{ url: cfg.discord.url, enabled: cfg.discord.enabled }] : []);
    const generic: EP[] = cfg?.generic?.endpoints ? toArray(cfg.generic.endpoints) : (cfg?.generic?.url ? [{ url: cfg.generic.url, enabled: cfg.generic.enabled, secret: cfg.generic.secret }] : []);

    const hasEvent = (ep: EP, name: 'digest') => Array.isArray(ep.events) ? ep.events.includes(name) : ((ep.delivery || 'immediate') === 'digest');
    const digestEps: Array<{ kind: 'slack'|'discord'|'generic', ep: EP }> = [];
    slack.forEach((ep: any) => { if (ep?.enabled && hasEvent(ep, 'digest') && (ep.digestInterval || 'hourly') === 'hourly' && ep?.url) digestEps.push({ kind: 'slack', ep: { ...ep, id: ep.id || makeId(ep.url) } }); });
    discord.forEach((ep: any) => { if (ep?.enabled && hasEvent(ep, 'digest') && (ep.digestInterval || 'hourly') === 'hourly' && ep?.url) digestEps.push({ kind: 'discord', ep: { ...ep, id: ep.id || makeId(ep.url) } }); });
    generic.forEach((ep: any) => { if (ep?.enabled && hasEvent(ep, 'digest') && (ep.digestInterval || 'hourly') === 'hourly' && ep?.url) digestEps.push({ kind: 'generic', ep: { ...ep, id: ep.id || makeId(ep.url) } }); });

    if (!digestEps.length) continue;

    const { data: items } = await supabaseAdmin
      .from('feedback')
      .select('id,created_at,message,email,url,type,rating,tags')
      .eq('project_id', p.id)
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    for (const { kind, ep } of digestEps) {
      const filtered = (items || []).filter((it: any) => {
        const r = ep.rules || {};
        if (typeof r.ratingMax === 'number' && typeof it.rating === 'number' && it.rating > r.ratingMax) return false;
        if (Array.isArray(r.types) && r.types.length && it.type && !r.types.includes(it.type)) return false;
        if (Array.isArray(r.tagsInclude) && r.tagsInclude.length) {
          const set = new Set((it.tags || []).map((t: any) => String(t).toLowerCase()));
          const ok = r.tagsInclude.some((t: any) => set.has(String(t).toLowerCase()));
          if (!ok) return false;
        }
        return true;
      });
      if (!filtered.length) continue;

      const count = filtered.length;
      const avgRating = (() => {
        const vals = filtered.map((x: any) => typeof x.rating === 'number' ? x.rating : null).filter((x: any) => x !== null);
        if (!vals.length) return null;
        const sum = vals.reduce((a: number, b: number) => a + b, 0);
        return (sum / vals.length).toFixed(2);
      })();
      const typeCounts = filtered.reduce((m: any, x: any) => { const k = x.type || 'general'; m[k] = (m[k]||0)+1; return m; }, {} as Record<string, number>);
      const icon = (t: string) => t === 'bug' ? ':beetle:' : t === 'idea' ? ':bulb:' : t === 'praise' ? ':sparkles:' : ':speech_balloon:';
      const iconText = (t: string) => t === 'bug' ? '🐞' : t === 'idea' ? '💡' : t === 'praise' ? '✨' : '💬';

      try {
        if (kind === 'slack') {
          const lines = [
            `*${p.name}* — ${count} new feedback in the last hour`,
            avgRating ? `Avg rating: ${avgRating}` : '',
            Object.keys(typeCounts).length ? `By type: ${Object.entries(typeCounts).map(([k,v])=>`${icon(k)} ${k}:${v}`).join(', ')}` : '',
            `View: ${APP_BASE_URL}/projects/${p.id}`,
          ].filter(Boolean).join('\n');
          const payload: any = (ep as any).format === 'compact'
            ? { text: lines }
            : {
                text: lines,
                attachments: [ { color: '#64748b', blocks: [ { type: 'section', text: { type: 'mrkdwn', text: lines } } ] } ],
              };
          const r = await postJson(ep.url, payload);
          await supabaseAdmin.from('webhook_deliveries').insert({ project_id: p.id, kind, url: ep.url, endpoint_id: ep.id, event: 'feedbacks.digest', status: r.ok ? 'success' : 'failed', status_code: r.status, error: r.ok ? null : r.bodyText, response_time_ms: r.ms });
        } else if (kind === 'discord') {
          const lines = [
            `**${p.name}** — ${count} new feedback in the last hour`,
            avgRating ? `Avg rating: ${avgRating}` : '',
            Object.keys(typeCounts).length ? `By type: ${Object.entries(typeCounts).map(([k,v])=>`${iconText(k)} ${k}: ${v}`).join(', ')}` : '',
            `View: ${APP_BASE_URL}/projects/${p.id}`,
          ].filter(Boolean).join('\n');
          const payload: any = (ep as any).format === 'compact'
            ? { content: lines, username: 'feedbacks.dev' }
            : { content: '', username: 'feedbacks.dev', embeds: [{ description: lines, color: 0x64748b }] };
          const r = await postJson(ep.url, payload);
          await supabaseAdmin.from('webhook_deliveries').insert({ project_id: p.id, kind, url: ep.url, endpoint_id: ep.id, event: 'feedbacks.digest', status: r.ok ? 'success' : 'failed', status_code: r.status, error: r.ok ? null : r.bodyText, response_time_ms: r.ms });
        } else {
          const payload = {
            event: 'feedback.digest',
            project_id: p.id,
            project: p.name,
            since,
            until,
            count,
            avg_rating: avgRating ? Number(avgRating) : null,
            items: filtered.slice(-25).map((x: any) => ({ id: x.id, created_at: x.created_at, message: x.message, email: x.email, url: x.url, type: x.type, rating: x.rating, tags: x.tags }))
          };
          let headers: Record<string,string> | undefined;
          if (ep.secret) {
            const ts = Math.floor(Date.now() / 1000).toString();
            const bodyStr = JSON.stringify(payload);
            const hmac = crypto.createHmac('sha256', String(ep.secret));
            hmac.update(`${ts}.${bodyStr}`);
            headers = { 'X-Feedbacks-Timestamp': ts, 'X-Feedbacks-Signature': hmac.digest('hex') };
          }
          const r = await postJson(ep.url, payload, headers);
          await supabaseAdmin.from('webhook_deliveries').insert({ project_id: p.id, kind, url: ep.url, endpoint_id: ep.id, event: 'feedbacks.digest', status: r.ok ? 'success' : 'failed', status_code: r.status, error: r.ok ? null : r.bodyText, response_time_ms: r.ms, payload });
        }
      } catch (e: any) {
        await supabaseAdmin.from('webhook_deliveries').insert({ project_id: p.id, kind, url: ep.url, endpoint_id: ep.id, event: 'feedbacks.digest', status: 'failed', error: e?.message?.slice(0,500) || 'error' });
      }
    }
  }

  return NextResponse.json({ ok: true, window: '1h' });
}

// Allow GET for platforms that only support GET cron hooks (e.g., Vercel Cron)
export async function GET(req: NextRequest) {
  return POST(req);
}
