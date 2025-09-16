import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role client only in server-side API routes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://app.feedbacks.dev';

function isValidEmail(email?: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getClientIp(req: NextRequest): string {
  const h = req.headers;
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = h.get('x-real-ip'); if (real) return real;
  const cf = h.get('cf-connecting-ip'); if (cf) return cf;
  return 'unknown';
}

async function rateLimit(route: string, key: string, limit: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await supabaseAdmin
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('route', route)
    .eq('key', key)
    .gte('created_at', since);
  if ((count || 0) >= limit) return false;
  await supabaseAdmin.from('rate_limits').insert({ key, route });
  return true;
}


async function loadDefaultWidgetConfig(projectId: string, channel = 'default'): Promise<Record<string, any>> {
  try {
    const { data } = await supabaseAdmin
      .from('widget_configs')
      .select('config')
      .eq('project_id', projectId)
      .eq('channel', channel)
      .order('is_default', { ascending: false })
      .order('version', { ascending: false })
      .limit(1);
    if (Array.isArray(data) && data.length > 0) {
      const cfg = data[0]?.config;
      if (cfg && typeof cfg === 'object') return cfg as Record<string, any>;
    }
    const { data: fallback } = await supabaseAdmin
      .from('widget_configs')
      .select('config')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1);
    if (Array.isArray(fallback) && fallback.length > 0) {
      const cfg = fallback[0]?.config;
      if (cfg && typeof cfg === 'object') return cfg as Record<string, any>;
    }
  } catch {}
  return {};
}
async function verifyTurnstile(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true;
  if (!token) return false;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) })
  });
  const data = await r.json().catch(()=>({success:false}));
  return !!data.success;
}

async function verifyHCaptcha(token: string, ip?: string) {
  const secret = process.env.HCAPTCHA_SECRET;
  if (!secret) return true;
  if (!token) return false;
  const form = new URLSearchParams({ secret, response: token }); if (ip) form.set('remoteip', ip);
  const r = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body: form });
  const data = await r.json().catch(()=>({success:false}));
  return !!data.success;
}

async function logDelivery(entry: {
  project_id: string;
  kind: 'slack'|'discord'|'generic';
  url: string;
  event: string;
  status: 'success'|'failed';
  status_code?: number | null;
  error?: string | null;
  payload?: any;
  response_time_ms?: number | null;
  response_body?: string | null;
  endpoint_id?: string | null;
  attempt?: number | null;
}) {
  try {
    await supabaseAdmin.from('webhook_deliveries').insert({
      project_id: entry.project_id,
      kind: entry.kind,
      url: entry.url,
      event: entry.event,
      status: entry.status,
      status_code: typeof entry.status_code === 'number' ? entry.status_code : null,
      error: entry.error || null,
      payload: entry.payload ? JSON.parse(JSON.stringify(entry.payload)) : null,
      response_time_ms: typeof entry.response_time_ms === 'number' ? entry.response_time_ms : null,
      response_body: entry.response_body || null,
      endpoint_id: entry.endpoint_id || null,
      attempt: entry.attempt || null,
    });
  } catch {}
}

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

async function deliverWithRetry(url: string, body: any, opts?: { headers?: Record<string,string>, timeoutMs?: number, retries?: number, backoffMs?: number }) {
  const headers = opts?.headers;
  const timeoutMs = opts?.timeoutMs ?? 4000;
  const retries = Math.max(0, opts?.retries ?? 2); // total attempts = retries+1
  const backoffMs = opts?.backoffMs ?? 400;
  let lastErr: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const start = Date.now();
      const res = await postJson(url, body, headers, timeoutMs);
      const ms = Date.now() - start;
      const text = await res.text().catch(() => '');
      return { ok: res.ok, status: res.status, bodyText: text?.slice(0, 500) || '', ms, attempt: attempt + 1 };
    } catch (e: any) {
      lastErr = e;
      if (attempt < retries) {
        const delay = backoffMs * Math.pow(1.5, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
  }
  return { ok: false, status: 0, bodyText: String(lastErr?.message || 'error').slice(0, 500), ms: null as number | null, attempt: retries + 1 };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let apiKey: string | undefined;
    let message: string | undefined;
    let email: string | undefined;
    let url: string | undefined;
    let userAgent: string | undefined;
    let type: string | undefined;
    let rating: any;
    let screenshot: string | undefined;
    let priority: string | undefined;
    let tags: any;
    let attachmentFile: File | null = null;
    let honeypot: string = '';
    let turnstileToken: string = '';
    let hcaptchaToken: string = '';
    let ip = getClientIp(request);

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      apiKey = form.get('apiKey') as string | undefined;
      message = form.get('message') as string | undefined;
      email = form.get('email') as string | undefined;
      url = form.get('url') as string | undefined;
      userAgent = (form.get('userAgent') as string | undefined) || request.headers.get('user-agent') || undefined;
      type = form.get('type') as string | undefined;
      rating = form.get('rating') as string | undefined;
      screenshot = form.get('screenshot') as string | undefined;
      priority = form.get('priority') as string | undefined;
      const tagsRaw = form.get('tags');
      tags = tagsRaw ? (typeof tagsRaw === 'string' ? tagsRaw.split(',') : tagsRaw) : undefined;
      // Anti-spam fields
      honeypot = (form.get('hp') as string | undefined) || (form.get('honeypot') as string | undefined) || '';
      turnstileToken = (form.get('turnstileToken') as string | undefined) || '';
      hcaptchaToken = (form.get('hcaptchaToken') as string | undefined) || '';
      if (honeypot && honeypot.trim()) {
        return NextResponse.json({ success: false, error: 'Spam detected' }, { status: 400, headers: corsHeaders });
      }
      // Rate limit (per project overrides below, this is pre-check to avoid abuse before project resolution)
      if (!(await rateLimit('feedback', ip, 5, 60_000))) {
        return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429, headers: corsHeaders });
      }
      // Captcha verification (optional): if tokens are provided, verify them;
      // otherwise skip here and enforce via per-project settings below.
      const hasTs = !!turnstileToken;
      const hasHc = !!hcaptchaToken;
      const canVerifyTs = !!process.env.TURNSTILE_SECRET && hasTs;
      const canVerifyHc = !!process.env.HCAPTCHA_SECRET && hasHc;
      if (canVerifyTs || canVerifyHc) {
        const okTs = canVerifyTs ? await verifyTurnstile(turnstileToken, ip) : false;
        const okHc = canVerifyHc ? await verifyHCaptcha(hcaptchaToken, ip) : false;
        if (!(okTs || okHc)) {
          return NextResponse.json({ success: false, error: 'Captcha failed' }, { status: 400, headers: corsHeaders });
        }
      }
      const f = form.get('attachment');
      attachmentFile = (f instanceof File) ? f : null;
    } else {
      const body = await request.json();
      ({ apiKey, message, email, url, userAgent, type, rating, screenshot, priority, tags } = body || {});
      honeypot = (body?.hp || body?.honeypot || '') as string;
      turnstileToken = (body?.turnstileToken || '') as string;
      hcaptchaToken = (body?.hcaptchaToken || '') as string;
      ip = getClientIp(request);
      if (honeypot && String(honeypot).trim()) {
        return NextResponse.json({ success: false, error: 'Spam detected' }, { status: 400, headers: corsHeaders });
      }
      if (!(await rateLimit('feedback', ip, 5, 60_000))) {
        return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429, headers: corsHeaders });
      }
      // Captcha verification (optional): verify only if tokens provided
      const hasTs = !!turnstileToken;
      const hasHc = !!hcaptchaToken;
      const canVerifyTs = !!process.env.TURNSTILE_SECRET && hasTs;
      const canVerifyHc = !!process.env.HCAPTCHA_SECRET && hasHc;
      if (canVerifyTs || canVerifyHc) {
        const okTs = canVerifyTs ? await verifyTurnstile(turnstileToken, ip) : false;
        const okHc = canVerifyHc ? await verifyHCaptcha(hcaptchaToken, ip) : false;
        if (!(okTs || okHc)) {
          return NextResponse.json({ success: false, error: 'Captcha failed' }, { status: 400, headers: corsHeaders });
        }
      }
    }

    // Validate required fields
    if (!apiKey || !message || !url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate message
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 2 || trimmedMessage.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message must be between 2 and 2000 characters' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email if provided
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate optional type
    const allowedTypes = new Set(['bug', 'idea', 'praise']);
    if (typeof type !== 'undefined' && type !== null && !allowedTypes.has(String(type))) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback type' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate optional rating
    const numericRating = typeof rating === 'string' ? parseInt(rating, 10) : rating;
    if (
      typeof numericRating !== 'undefined' && numericRating !== null &&
      (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid rating value' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate optional priority
    const allowedPriorities = new Set(['low','medium','high']);
    if (typeof priority !== 'undefined' && priority !== null && !allowedPriorities.has(String(priority))) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority value' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize tags
    let tagArray: string[] | null = null;
    if (Array.isArray(tags)) {
      tagArray = (tags as any[]).map(String).map(s => s.trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      tagArray = tags.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Find project by API key
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id,name,webhooks')
      .eq('api_key', apiKey)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Invalid project key' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Optional screenshot upload
    let screenshotUrl: string | null = null;
    if (typeof screenshot === 'string' && screenshot.startsWith('data:image/')) {
      try {
        const bucket = 'feedback_screenshots';
        const base64 = screenshot.split(',')[1] || '';
        const bytes = Buffer.from(base64, 'base64');
        const ext = screenshot.startsWith('data:image/png') ? 'png' : 'jpg';
        const fileName = `${project.id}/${new Date().getUTCFullYear()}/${(crypto.randomUUID?.() || Math.random().toString(36).slice(2))}.${ext}`;
        const up = await supabaseAdmin.storage.from(bucket).upload(fileName, bytes, {
          contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
          upsert: false,
        });
        if (!up.error) {
          const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
          screenshotUrl = data.publicUrl || null;
        }
      } catch (e) {
        console.warn('Screenshot upload failed:', e);
      }
    }

    // Optional attachment upload (single file)
    let attachments: Array<{ url: string; name: string; type: string; size: number }> | null = null;
    if (attachmentFile) {
      try {
        const maxBytes = 5 * 1024 * 1024; // 5 MB
        const allowed = new Set(['image/png', 'image/jpeg', 'application/pdf']);
        const fileType = (attachmentFile as any).type as string;
        const fileSize = (attachmentFile as any).size as number;
        if (!allowed.has(fileType)) {
          return NextResponse.json(
            { success: false, error: 'Unsupported attachment type' },
            { status: 400, headers: corsHeaders }
          );
        }
        if (fileSize > maxBytes) {
          return NextResponse.json(
            { success: false, error: 'Attachment too large' },
            { status: 400, headers: corsHeaders }
          );
        }
        const arrayBuf = await (attachmentFile as any).arrayBuffer();
        const bytes = Buffer.from(arrayBuf);
        const bucket = 'feedback_attachments';
        const ext = fileType === 'application/pdf' ? 'pdf' : (fileType === 'image/png' ? 'png' : 'jpg');
        const baseName = (attachmentFile as any).name?.replace(/[^a-zA-Z0-9_.-]/g, '_') || 'attachment';
        const fileName = `${project.id}/${new Date().getUTCFullYear()}/${(crypto.randomUUID?.() || Math.random().toString(36).slice(2))}-${baseName}.${ext}`;
        const up = await supabaseAdmin.storage.from(bucket).upload(fileName, bytes, {
          contentType: fileType,
          upsert: false,
        });
        if (!up.error) {
          const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
          attachments = [{ url: data.publicUrl || '', name: baseName, type: fileType, size: fileSize }];
        }
      } catch (e) {
        console.warn('Attachment upload failed:', e);
      }
    }

    // Enforce captcha if required by project config
    const widgetCfg: any = await loadDefaultWidgetConfig(project.id);
    // Per-project rate limits (override)
    const rlCount = typeof widgetCfg.rateLimitCount === 'number' ? widgetCfg.rateLimitCount : 5;
    const rlWindowSec = typeof widgetCfg.rateLimitWindowSec === 'number' ? widgetCfg.rateLimitWindowSec : 60;
    const ip2 = getClientIp(request);
    if (!(await rateLimit(`feedback:${project.id}`, ip2, rlCount, rlWindowSec * 1000))) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429, headers: corsHeaders });
    }

    if (widgetCfg.requireCaptcha) {
      if (widgetCfg.captchaProvider === 'turnstile') {
        const ok = await verifyTurnstile(turnstileToken, ip);
        if (!ok) {
          return NextResponse.json({ success: false, error: 'Captcha required' }, { status: 400, headers: corsHeaders });
        }
      } else if (widgetCfg.captchaProvider === 'hcaptcha') {
        const ok = await verifyHCaptcha(hcaptchaToken, ip);
        if (!ok) {
          return NextResponse.json({ success: false, error: 'Captcha required' }, { status: 400, headers: corsHeaders });
        }
      }
    }

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('feedback')
      .insert({
        project_id: project.id,
        message: trimmedMessage,
        email: email?.trim() || null,
        url: url.trim(),
        user_agent: userAgent || request.headers.get('user-agent') || 'Unknown',
        type: type ? String(type) : null,
        rating: typeof numericRating === 'number' ? numericRating : null,
        priority: priority ? String(priority) : null,
        tags: tagArray && tagArray.length ? tagArray : null,
        screenshot_url: screenshotUrl,
        attachments: attachments,
      })
      .select('id,created_at')
      .single();

    if (feedbackError) {
      console.error('Database error:', feedbackError);
      return NextResponse.json(
        { success: false, error: 'Failed to save feedback' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Deliver webhooks (best-effort)
    const cfg = (project as any).webhooks || {};
    const event = 'feedbacks.created';
    const baseText = `${project.name || 'Project'}: ${type ? `[${type}] ` : ''}${trimmedMessage}${typeof numericRating === 'number' ? ` (rating ${numericRating}/5)` : ''}`;
    const genericPayload = {
      event,
      project_id: project.id,
      project: project.name,
      feedback: {
        id: feedback.id,
        created_at: feedback.created_at,
        message: trimmedMessage,
        email: email || null,
        url,
        type: type || null,
        rating: typeof numericRating === 'number' ? numericRating : null,
        priority: priority || null,
        tags: tagArray || null,
        screenshot_url: screenshotUrl,
        attachments: attachments,
      },
    };

    // Helpers for multi-endpoint config
    type Rules = { ratingMax?: number; types?: Array<'bug'|'idea'|'praise'>; tagsInclude?: string[] };
    type Endpoint = {
      kind: 'slack'|'discord'|'generic';
      id: string;
      url: string;
      enabled: boolean;
      delivery?: 'immediate'|'digest';
      digestInterval?: 'hourly';
      secret?: string; // generic only
      rules?: Rules;
      events?: string[]; // e.g., ['created','digest']
      rateLimitPerMin?: number; // cap sends per minute for this endpoint (immediate only)
      redact?: { email?: boolean; url?: boolean };
      format?: 'compact' | 'full'; // optional format property
    };
    const makeId = (url: string) => 'u-' + crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
    const toArray = (maybe: any) => Array.isArray(maybe) ? maybe : [];
    const endpoints: Endpoint[] = [];
    // Slack endpoints
    if (cfg?.slack?.endpoints) {
      for (const ep of toArray(cfg.slack.endpoints)) {
        if (!ep?.url) continue;
        endpoints.push({ kind: 'slack', id: ep.id || makeId(ep.url), url: ep.url, enabled: !!ep.enabled, delivery: ep.delivery || 'immediate', digestInterval: ep.digestInterval || 'hourly', rules: ep.rules, events: ep.events, rateLimitPerMin: ep.rateLimitPerMin, redact: ep.redact });
      }
    } else if (cfg?.slack?.url) {
      endpoints.push({ kind: 'slack', id: makeId(cfg.slack.url), url: cfg.slack.url, enabled: !!cfg.slack.enabled, delivery: 'immediate' });
    }
    // Discord endpoints
    if (cfg?.discord?.endpoints) {
      for (const ep of toArray(cfg.discord.endpoints)) {
        if (!ep?.url) continue;
        endpoints.push({ kind: 'discord', id: ep.id || makeId(ep.url), url: ep.url, enabled: !!ep.enabled, delivery: ep.delivery || 'immediate', digestInterval: ep.digestInterval || 'hourly', rules: ep.rules, events: ep.events, rateLimitPerMin: ep.rateLimitPerMin, redact: ep.redact });
      }
    } else if (cfg?.discord?.url) {
      endpoints.push({ kind: 'discord', id: makeId(cfg.discord.url), url: cfg.discord.url, enabled: !!cfg.discord.enabled, delivery: 'immediate' });
    }
    // Generic endpoints
    if (cfg?.generic?.endpoints) {
      for (const ep of toArray(cfg.generic.endpoints)) {
        if (!ep?.url) continue;
        endpoints.push({ kind: 'generic', id: ep.id || makeId(ep.url), url: ep.url, enabled: !!ep.enabled, delivery: ep.delivery || 'immediate', digestInterval: ep.digestInterval || 'hourly', rules: ep.rules, secret: ep.secret, events: ep.events, rateLimitPerMin: ep.rateLimitPerMin, redact: ep.redact });
      }
    } else if (cfg?.generic?.url) {
      endpoints.push({ kind: 'generic', id: makeId(cfg.generic.url), url: cfg.generic.url, enabled: !!cfg.generic.enabled, delivery: 'immediate', secret: cfg.generic.secret });
    }

    const matchesRules = (rules?: Rules) => {
      if (!rules) return true;
      if (typeof rules.ratingMax === 'number' && typeof numericRating === 'number' && numericRating > rules.ratingMax) return false;
      if (Array.isArray(rules.types) && rules.types.length && type && !rules.types.includes(type as any)) return false;
      if (Array.isArray(rules.tagsInclude) && rules.tagsInclude.length) {
        const set = new Set((tagArray || []).map(t => t.toLowerCase()));
        const ok = rules.tagsInclude.some((t) => set.has(String(t).toLowerCase()));
        if (!ok) return false;
      }
      return true;
    };

    const hasEvent = (ep: Endpoint, name: 'created'|'digest') => Array.isArray(ep.events) ? ep.events.includes(name) : (name === 'created' ? (ep.delivery !== 'digest') : (ep.delivery === 'digest'));

    const isRateLimited = async (ep: Endpoint) => {
      if (!ep.rateLimitPerMin || ep.rateLimitPerMin <= 0) return false;
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const res = await supabaseAdmin
        .from('webhook_deliveries')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project.id)
        .eq('endpoint_id', ep.id)
        .gte('created_at', oneMinuteAgo);
      const count = (res as any)?.count || 0;
      return count >= ep.rateLimitPerMin;
    }

    const redactGenericPayload = (ep: Endpoint, payload: any) => {
      if (!ep.redact) return payload;
      const clone = JSON.parse(JSON.stringify(payload));
      if (ep.redact.email && clone?.feedback) clone.feedback.email = null;
      if (ep.redact.url && clone?.feedback) clone.feedback.url = null;
      return clone;
    }

    // Construct a view link and formatting helpers
    const viewUrl = `${APP_BASE_URL}/projects/${project.id}`;
    const viewFeedbackUrl = `${APP_BASE_URL}/feedback/${feedback.id}`;
    const typeKey = (typeof type === 'string') ? (type as 'bug'|'idea'|'praise') : undefined;
    const slackColor = typeKey === 'bug' ? '#dc2626' : typeKey === 'idea' ? '#2563eb' : typeKey === 'praise' ? '#16a34a' : '#6b7280';
    const typeEmoji = typeKey === 'bug' ? ':beetle:' : typeKey === 'idea' ? ':bulb:' : typeKey === 'praise' ? ':sparkles:' : ':speech_balloon:';
    const discordColor = typeKey === 'bug' ? 0xdc2626 : typeKey === 'idea' ? 0x2563eb : typeKey === 'praise' ? 0x16a34a : 0x64748b;

    const deliveries: Promise<any>[] = [];
    for (const ep of endpoints) {
      if (!ep.enabled) continue;
      if (!hasEvent(ep, 'created')) continue; // only process created here
      if (!matchesRules(ep.rules)) continue;
      if (await isRateLimited(ep)) continue;

      if (ep.kind === 'slack') {
        deliveries.push((async () => {
          try {
            const title = `${typeEmoji} ${project.name || 'Project'}`;
            const text = `${type ? `*${String(type).toUpperCase()}* ` : ''}${trimmedMessage}`;
            const fields: any[] = [];
            if (typeof numericRating === 'number') fields.push({ type: 'mrkdwn', text: `*Rating:* ${numericRating}/5` });
            if (type) fields.push({ type: 'mrkdwn', text: `*Type:* ${type}` });
            if ((tagArray || []).length) fields.push({ type: 'mrkdwn', text: `*Tags:* ${(tagArray || []).slice(0,6).join(', ')}` });
            const payload: any = ep.format === 'compact'
              ? {
                  text: `${project.name || 'Project'}: ${type ? `[${type}] ` : ''}${trimmedMessage} — View: ${viewFeedbackUrl}`,
                }
              : {
                  text: `${project.name || 'Project'} — ${trimmedMessage}`,
                  attachments: [ {
                    color: slackColor,
                    blocks: [
                      { type: 'section', text: { type: 'mrkdwn', text: `*${title}* — <${viewUrl}|View Project> • <${viewFeedbackUrl}|View Feedback>` } },
                      { type: 'section', text: { type: 'mrkdwn', text } },
                      ...(fields.length ? [{ type: 'section', fields }] : []),
                    ]
                  } ],
                };
            const res = await deliverWithRetry(ep.url, payload);
            await logDelivery({ project_id: project.id, kind: 'slack', url: ep.url, endpoint_id: ep.id, event, status: res.ok ? 'success' : 'failed', status_code: res.status, error: res.ok ? null : res.bodyText, payload, response_time_ms: res.ms, response_body: res.ok ? null : res.bodyText, attempt: res.attempt });
            if (!res.ok) {
              // Check consecutive failures to auto-disable
              const { data: recent } = await supabaseAdmin.from('webhook_deliveries').select('status').eq('project_id', project.id).eq('endpoint_id', ep.id).order('created_at', { ascending: false }).limit(3);
              let consec = 0; for (const r of (recent || [])) { if (r.status === 'failed') consec++; else break; }
              if (consec >= 3) {
                try {
                  // Disable this endpoint in config
                  const cfgFull = (project as any).webhooks || {};
                  const arr = toArray(cfgFull?.slack?.endpoints);
                  const idx = arr.findIndex((x: any) => (x?.id || makeId(x?.url||'')) === ep.id);
                  if (idx >= 0) { arr[idx].enabled = false; cfgFull.slack.endpoints = arr; await supabaseAdmin.from('projects').update({ webhooks: cfgFull }).eq('id', project.id); }
                } catch {}
              }
            }
          } catch (e: any) {
            await logDelivery({ project_id: project.id, kind: 'slack', url: ep.url, endpoint_id: ep.id, event, status: 'failed', error: e?.message?.slice(0,500) || 'error' });
          }
        })());
      } else if (ep.kind === 'discord') {
        deliveries.push((async () => {
          try {
            const title = project.name || 'Project';
            const description = `${type ? `[${type}] ` : ''}${trimmedMessage}`;
            const payload: any = ep.format === 'compact'
              ? { content: `${title}: ${type ? `[${type}] ` : ''}${trimmedMessage} — ${viewFeedbackUrl}`, username: 'feedbacks.dev' }
              : {
                  content: '',
                  username: 'feedbacks.dev',
                  embeds: [
                    {
                      title,
                      url: viewFeedbackUrl,
                      description,
                      color: discordColor,
                      fields: [
                        ...(typeof numericRating === 'number' ? [{ name: 'Rating', value: `${numericRating}/5`, inline: true }] : []),
                        ...(type ? [{ name: 'Type', value: String(type), inline: true }] : []),
                        ...(((tagArray || []).length) ? [{ name: 'Tags', value: (tagArray || []).slice(0,6).join(', '), inline: false }] : []),
                      ],
                    },
                  ],
                };
            const res = await deliverWithRetry(ep.url, payload);
            await logDelivery({ project_id: project.id, kind: 'discord', url: ep.url, endpoint_id: ep.id, event, status: res.ok ? 'success' : 'failed', status_code: res.status, error: res.ok ? null : res.bodyText, payload, response_time_ms: res.ms, response_body: res.ok ? null : res.bodyText, attempt: res.attempt });
            if (!res.ok) {
              const { data: recent } = await supabaseAdmin.from('webhook_deliveries').select('status').eq('project_id', project.id).eq('endpoint_id', ep.id).order('created_at', { ascending: false }).limit(3);
              let consec = 0; for (const r of (recent || [])) { if (r.status === 'failed') consec++; else break; }
              if (consec >= 3) {
                try {
                  const cfgFull = (project as any).webhooks || {};
                  const arr = toArray(cfgFull?.discord?.endpoints);
                  const idx = arr.findIndex((x: any) => (x?.id || makeId(x?.url||'')) === ep.id);
                  if (idx >= 0) { arr[idx].enabled = false; cfgFull.discord.endpoints = arr; await supabaseAdmin.from('projects').update({ webhooks: cfgFull }).eq('id', project.id); }
                } catch {}
              }
            }
          } catch (e: any) {
            await logDelivery({ project_id: project.id, kind: 'discord', url: ep.url, endpoint_id: ep.id, event, status: 'failed', error: e?.message?.slice(0,500) || 'error' });
          }
        })());
      } else if (ep.kind === 'generic') {
        deliveries.push((async () => {
          try {
            let headers: Record<string,string> | undefined;
            if (ep.secret) {
              const ts = Math.floor(Date.now() / 1000).toString();
              const bodyStr = JSON.stringify(redactGenericPayload(ep, genericPayload));
              const hmac = crypto.createHmac('sha256', String(ep.secret));
              hmac.update(`${ts}.${bodyStr}`);
              headers = { 'X-Feedbacks-Timestamp': ts, 'X-Feedbacks-Signature': hmac.digest('hex') };
            }
            const payload = redactGenericPayload(ep, genericPayload);
            const res = await deliverWithRetry(ep.url, payload, { headers });
            await logDelivery({ project_id: project.id, kind: 'generic', url: ep.url, endpoint_id: ep.id, event, status: res.ok ? 'success' : 'failed', status_code: res.status, error: res.ok ? null : res.bodyText, payload, response_time_ms: res.ms, response_body: res.ok ? null : res.bodyText, attempt: res.attempt });
            if (!res.ok) {
              const { data: recent } = await supabaseAdmin.from('webhook_deliveries').select('status').eq('project_id', project.id).eq('endpoint_id', ep.id).order('created_at', { ascending: false }).limit(3);
              let consec = 0; for (const r of (recent || [])) { if (r.status === 'failed') consec++; else break; }
              if (consec >= 3) {
                try {
                  const cfgFull = (project as any).webhooks || {};
                  const arr = toArray(cfgFull?.generic?.endpoints);
                  const idx = arr.findIndex((x: any) => (x?.id || makeId(x?.url||'')) === ep.id);
                  if (idx >= 0) { arr[idx].enabled = false; cfgFull.generic.endpoints = arr; await supabaseAdmin.from('projects').update({ webhooks: cfgFull }).eq('id', project.id); }
                } catch {}
              }
            }
          } catch (e: any) {
            await logDelivery({ project_id: project.id, kind: 'generic', url: ep.url, endpoint_id: ep.id, event, status: 'failed', error: e?.message?.slice(0,500) || 'error', payload: genericPayload });
          }
        })());
      }
    }

    if (deliveries.length) {
      // Best-effort; don't block too long
      await Promise.race([
        Promise.allSettled(deliveries),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }

    return NextResponse.json({ success: true, id: feedback.id }, { headers: corsHeaders });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
