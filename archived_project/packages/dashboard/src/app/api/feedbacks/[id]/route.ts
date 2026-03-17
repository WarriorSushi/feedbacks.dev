import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Admin client for logging and cross-project queries
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function logDelivery(entry: any) {
  try { await supabaseAdmin.from('webhook_deliveries').insert(entry); } catch {}
}

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
  } finally { clearTimeout(t); }
}

async function deliverWithRetry(url: string, body: any, opts?: { headers?: Record<string,string>, timeoutMs?: number, retries?: number, backoffMs?: number }) {
  const headers = opts?.headers;
  const timeoutMs = opts?.timeoutMs ?? 4000;
  const retries = Math.max(0, opts?.retries ?? 2);
  const backoffMs = opts?.backoffMs ?? 400;
  let lastErr: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const start = Date.now();
      const res = await postJson(url, body, headers, timeoutMs);
      const ms = Date.now() - start;
      return { ok: res.ok, status: res.status, bodyText: res.bodyText, ms, attempt: attempt + 1 };
    } catch (e: any) {
      lastErr = e;
      if (attempt < retries) {
        const delay = backoffMs * Math.pow(1.5, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
  }
  return { ok: false, status: 0, bodyText: String(lastErr?.message || 'error').slice(0,500), ms: null as number | null, attempt: retries + 1 };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { is_read, add_tag, remove_tag, archived } = body || {};

  // Load feedback row with ownership via RLS
  const { data: row, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('id', params.id)
    .single();
  if (error || !row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Apply changes
  const updates: any = {};
  const changes: any = {};
  if (typeof is_read === 'boolean') { updates.is_read = is_read; changes.is_read = is_read; }
  if (typeof archived === 'boolean') { updates.archived = archived; changes.archived = archived; }
  if (typeof add_tag === 'string' && add_tag.trim()) {
    const cur = Array.isArray(row.tags) ? row.tags : [];
    const next = Array.from(new Set([...cur, add_tag.trim()]));
    updates.tags = next; changes.add_tag = add_tag.trim(); changes.tags = next;
  }
  if (typeof remove_tag === 'string' && remove_tag.trim()) {
    const cur = Array.isArray(row.tags) ? row.tags : [];
    const next = cur.filter((t: string) => t !== remove_tag.trim());
    updates.tags = next; changes.remove_tag = remove_tag.trim(); changes.tags = next;
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: false, error: 'No changes' }, { status: 400 });

  const { error: upErr } = await supabase
    .from('feedback')
    .update(updates)
    .eq('id', params.id);
  if (upErr) return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 400 });

  // Reload fresh row for payload
  const { data: fresh } = await supabase.from('feedback').select('*').eq('id', params.id).single();

  // Load project + webhooks via admin to read config
  const { data: proj } = await supabaseAdmin
    .from('projects')
    .select('id,name,webhooks')
    .eq('id', row.project_id)
    .single();

  const cfg = (proj as any)?.webhooks || {};
  const event = 'feedbacks.updated';
  const payloadBase = {
    event,
    project_id: proj?.id,
    project: proj?.name,
    feedback: {
      id: params.id,
      created_at: fresh?.created_at || row.created_at,
      message: fresh?.message || row.message,
      email: fresh?.email || row.email || null,
      url: fresh?.url || row.url,
      type: fresh?.type || row.type || null,
      rating: typeof fresh?.rating === 'number' ? fresh.rating : (typeof row.rating === 'number' ? row.rating : null),
      priority: fresh?.priority || row.priority || null,
      tags: Array.isArray(fresh?.tags) ? fresh.tags : (Array.isArray(row.tags) ? row.tags : null),
      screenshot_url: fresh?.screenshot_url || row.screenshot_url || null,
      attachments: Array.isArray(fresh?.attachments) ? fresh.attachments : (Array.isArray(row.attachments) ? row.attachments : null),
      is_read: typeof fresh?.is_read === 'boolean' ? fresh.is_read : !!row.is_read,
    },
    changes,
  };

  // Build endpoints similar to created route
  const toArray = (x: any) => (Array.isArray(x) ? x : []);
  const makeId = (url: string) => 'u-' + crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
  const endpoints: Array<any> = [];
  if (cfg?.slack?.endpoints) toArray(cfg.slack.endpoints).forEach((ep: any) => ep?.url && endpoints.push({ kind: 'slack', ...ep, id: ep.id || makeId(ep.url) }));
  else if (cfg?.slack?.url) endpoints.push({ kind: 'slack', id: makeId(cfg.slack.url), url: cfg.slack.url, enabled: !!cfg.slack.enabled, events: ['created'] });
  if (cfg?.discord?.endpoints) toArray(cfg.discord.endpoints).forEach((ep: any) => ep?.url && endpoints.push({ kind: 'discord', ...ep, id: ep.id || makeId(ep.url) }));
  else if (cfg?.discord?.url) endpoints.push({ kind: 'discord', id: makeId(cfg.discord.url), url: cfg.discord.url, enabled: !!cfg.discord.enabled, events: ['created'] });
  if (cfg?.generic?.endpoints) toArray(cfg.generic.endpoints).forEach((ep: any) => ep?.url && endpoints.push({ kind: 'generic', ...ep, id: ep.id || makeId(ep.url) }));
  else if (cfg?.generic?.url) endpoints.push({ kind: 'generic', id: makeId(cfg.generic.url), url: cfg.generic.url, enabled: !!cfg.generic.enabled, secret: cfg.generic.secret, events: ['created'] });

  const hasUpdated = (ep: any) => Array.isArray(ep.events) ? ep.events.includes('updated') : false;

  const APP_BASE_URL = process.env.APP_BASE_URL || 'https://app.feedbacks.dev';
  const viewUrl = `${APP_BASE_URL}/projects/${proj?.id}`;
  const viewFeedbackUrl = `${APP_BASE_URL}/feedback/${params.id}`;
  const typeKey = (typeof payloadBase.feedback.type === 'string') ? (payloadBase.feedback.type as 'bug'|'idea'|'praise') : undefined;
  const slackColor = typeKey === 'bug' ? '#dc2626' : typeKey === 'idea' ? '#2563eb' : typeKey === 'praise' ? '#16a34a' : '#6b7280';
  const typeEmoji = typeKey === 'bug' ? ':beetle:' : typeKey === 'idea' ? ':bulb:' : typeKey === 'praise' ? ':sparkles:' : ':speech_balloon:';
  const discordColor = typeKey === 'bug' ? 0xdc2626 : typeKey === 'idea' ? 0x2563eb : typeKey === 'praise' ? 0x16a34a : 0x64748b;

  const deliveries: Promise<any>[] = [];
  for (const ep of endpoints) {
    if (!ep.enabled) continue;
    if (!hasUpdated(ep)) continue;

    if (ep.kind === 'slack') {
      deliveries.push((async () => {
        try {
          const title = `${typeEmoji} ${proj?.name || 'Project'}`;
          const changesText = Object.keys(changes).length ? Object.entries(changes).map(([k,v]) => `*${k}:* ${String(v)}`).join(' | ') : 'no fields';
          const payload: any = ep.format === 'compact'
            ? { text: `${proj?.name || 'Project'} updated: ${changesText} — ${viewFeedbackUrl}` }
            : {
                text: `${proj?.name || 'Project'} — Feedback updated` ,
                attachments: [{ color: slackColor, blocks: [
                  { type: 'section', text: { type: 'mrkdwn', text: `*${title}* — <${viewUrl}|View Project> • <${viewFeedbackUrl}|View Feedback>` } },
                  { type: 'section', text: { type: 'mrkdwn', text: `*Changes:* ${changesText}` } },
                ] }]
              };
          const res = await deliverWithRetry(ep.url, payload);
          await logDelivery({ project_id: proj?.id, kind: 'slack', url: ep.url, endpoint_id: ep.id, event, status: res.ok ? 'success' : 'failed', status_code: res.status, error: res.ok ? null : res.bodyText, payload: payloadBase, response_time_ms: res.ms, attempt: res.attempt });
        } catch (e: any) {
          await logDelivery({ project_id: proj?.id, kind: 'slack', url: ep.url, endpoint_id: ep.id, event, status: 'failed', error: e?.message?.slice(0,500) || 'error', payload: payloadBase });
        }
      })());
    } else if (ep.kind === 'discord') {
      deliveries.push((async () => {
        try {
          const title = proj?.name || 'Project';
          const changesText = Object.keys(changes).length ? Object.entries(changes).map(([k,v]) => `${k}: ${String(v)}`).join(' | ') : 'no fields';
          const payload: any = ep.format === 'compact'
            ? { content: `${title} updated: ${changesText} — ${viewFeedbackUrl}`, username: 'feedbacks.dev' }
            : {
                content: '', username: 'feedbacks.dev', embeds: [{
                  title, url: viewFeedbackUrl, description: `Feedback updated`, color: discordColor,
                  fields: [{ name: 'Changes', value: changesText, inline: false }]
                }]
              };
          const res = await deliverWithRetry(ep.url, payload);
          await logDelivery({ project_id: proj?.id, kind: 'discord', url: ep.url, endpoint_id: ep.id, event, status: res.ok ? 'success' : 'failed', status_code: res.status, error: res.ok ? null : res.bodyText, payload: payloadBase, response_time_ms: res.ms, attempt: res.attempt });
        } catch (e: any) {
          await logDelivery({ project_id: proj?.id, kind: 'discord', url: ep.url, endpoint_id: ep.id, event, status: 'failed', error: e?.message?.slice(0,500) || 'error', payload: payloadBase });
        }
      })());
    } else if (ep.kind === 'generic') {
      deliveries.push((async () => {
        try {
          let headers: Record<string,string> | undefined;
          const payload = payloadBase;
          if (ep.secret) {
            const ts = Math.floor(Date.now() / 1000).toString();
            const bodyStr = JSON.stringify(payload);
            const hmac = crypto.createHmac('sha256', String(ep.secret));
            hmac.update(`${ts}.${bodyStr}`);
            headers = { 'X-Feedbacks-Timestamp': ts, 'X-Feedbacks-Signature': hmac.digest('hex') };
          }
          const res = await deliverWithRetry(ep.url, payload, { headers });
          await logDelivery({ project_id: proj?.id, kind: 'generic', url: ep.url, endpoint_id: ep.id, event, status: res.ok ? 'success' : 'failed', status_code: res.status, error: res.ok ? null : res.bodyText, payload, response_time_ms: res.ms, attempt: res.attempt });
        } catch (e: any) {
          await logDelivery({ project_id: proj?.id, kind: 'generic', url: ep.url, endpoint_id: ep.id, event, status: 'failed', error: e?.message?.slice(0,500) || 'error', payload: payloadBase });
        }
      })());
    }
  }

  if (deliveries.length) {
    await Promise.race([
      Promise.allSettled(deliveries),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  }

  return NextResponse.json({ ok: true });
}

