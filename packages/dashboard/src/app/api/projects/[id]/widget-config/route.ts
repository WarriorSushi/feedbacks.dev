import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const DEFAULT_CHANNEL = 'default';
const ALLOWED_EMBED_MODES = ['modal', 'inline', 'trigger'] as const;
const ALLOWED_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
const ALLOWED_CAPTCHA_PROVIDERS = ['turnstile', 'hcaptcha', 'none'] as const;

function sanitizeValue(value: any): any {
  if (value === null) return null;
  const type = typeof value;
  if (type === 'string') {
    return value.length > 2000 ? value.slice(0, 2000) : value;
  }
  if (type === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (type === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeValue(entry))
      .filter((entry) => entry !== undefined);
  }
  if (type === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      if (typeof key !== 'string') continue;
      const sanitized = sanitizeValue(val);
      if (sanitized !== undefined) result[key] = sanitized;
    }
    return result;
  }
  return undefined;
}

function sanitizeWidgetConfig(input: any): Record<string, any> {
  if (!input || typeof input !== 'object') return {};
  const blocked = new Set(['projectKey', 'project_id', 'projectId', 'widgetVersion']);
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (blocked.has(key)) continue;
    const sanitized = sanitizeValue(value);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

function validateWidgetConfig(raw: any): { config: Record<string, any>; warnings: string[] } {
  const warnings: string[] = [];
  const config = sanitizeWidgetConfig(raw);

  const embedModeRaw = typeof config.embedMode === 'string' ? config.embedMode : 'modal';
  const embedMode = ALLOWED_EMBED_MODES.includes(embedModeRaw as any) ? embedModeRaw : 'modal';
  if (!ALLOWED_EMBED_MODES.includes(embedMode as any)) {
    warnings.push('embedMode reset to modal');
  }
  config.embedMode = embedMode;

  if (config.position && !ALLOWED_POSITIONS.includes(config.position)) {
    warnings.push('position reset to bottom-right');
    config.position = 'bottom-right';
  }

  if (typeof config.attachmentMaxMB === 'number') {
    if (config.attachmentMaxMB < 1 || config.attachmentMaxMB > 50) {
      config.attachmentMaxMB = Math.min(50, Math.max(1, Math.round(config.attachmentMaxMB)));
      warnings.push('attachmentMaxMB clamped between 1MB and 50MB');
    }
  }

  if (typeof config.scale === 'number') {
    if (config.scale < 0.5 || config.scale > 2) {
      config.scale = Number(config.scale.toFixed(2));
      config.scale = Math.min(2, Math.max(0.5, config.scale));
      warnings.push('scale clamped between 0.5 and 2');
    }
  }

  if (config.captchaProvider) {
    const provider = String(config.captchaProvider).toLowerCase();
    if (!ALLOWED_CAPTCHA_PROVIDERS.includes(provider as any)) {
      warnings.push('captchaProvider set to none');
      config.captchaProvider = 'none';
    } else {
      config.captchaProvider = provider;
    }
  }

  if (typeof config.rateLimitCount === 'number') {
    const value = Math.round(config.rateLimitCount);
    config.rateLimitCount = Math.min(200, Math.max(1, value));
  }

  if (typeof config.rateLimitWindowSec === 'number') {
    const value = Math.round(config.rateLimitWindowSec);
    config.rateLimitWindowSec = Math.min(3600, Math.max(5, value));
  }

  return { config, warnings };
}

function mapRow(row: any) {
  return {
    id: row.id,
    channel: row.channel,
    version: row.version,
    label: row.label,
    isDefault: !!row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    config: row.config || {},
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', params.id)
    .eq('owner_user_id', user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const HISTORY_LIMIT = 5;

  const { data: defaultRows } = await supabase
    .from('widget_configs')
    .select('id, channel, version, label, config, is_default, created_at, updated_at')
    .eq('project_id', params.id)
    .eq('is_default', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  let defaultRow = Array.isArray(defaultRows) && defaultRows.length > 0 ? defaultRows[0] : null;

  if (!defaultRow) {
    const { data: latestRows } = await supabase
      .from('widget_configs')
      .select('id, channel, version, label, config, is_default, created_at, updated_at')
      .eq('project_id', params.id)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (Array.isArray(latestRows) && latestRows.length > 0) {
      defaultRow = latestRows[0];
    }
  }

  const historyChannel = defaultRow?.channel || DEFAULT_CHANNEL;

  const { data: rows, count } = await supabase
    .from('widget_configs')
    .select('id, channel, version, label, config, is_default, created_at, updated_at', { count: 'exact' })
    .eq('project_id', params.id)
    .eq('channel', historyChannel)
    .order('version', { ascending: false })
    .limit(HISTORY_LIMIT);

  const history = Array.isArray(rows) ? rows.map(mapRow) : [];
  const defaultConfig = defaultRow ? mapRow(defaultRow) : null;
  const existingIdx = defaultConfig ? history.findIndex((item) => item.id === defaultConfig.id) : -1;
  if (defaultConfig && existingIdx === -1) {
    history.unshift(defaultConfig);
  }
  const trimmedHistory = history.slice(0, HISTORY_LIMIT);
  const hasMoreHistory = typeof count === 'number' ? count > HISTORY_LIMIT : false;

  return NextResponse.json({
    config: defaultConfig?.config || {},
    defaultConfig,
    configs: trimmedHistory,
    channel: defaultConfig?.channel || historyChannel,
    hasMoreHistory,
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null && 'config' in body ? body.config : body;
  const channelRaw = typeof body?.channel === 'string' ? body.channel : DEFAULT_CHANNEL;
  const label = typeof body?.label === 'string' && body.label.trim().length > 0 ? body.label.trim() : undefined;
  const channel = channelRaw.trim().length > 0 ? channelRaw.trim().toLowerCase() : DEFAULT_CHANNEL;

  const { config, warnings } = validateWidgetConfig(payload);

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', params.id)
    .eq('owner_user_id', user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Determine next version number
  const { data: latest } = await supabase
    .from('widget_configs')
    .select('version')
    .eq('project_id', params.id)
    .eq('channel', channel)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = Array.isArray(latest) && latest.length > 0 ? (Number(latest[0].version) || 0) + 1 : 1;

  await supabase
    .from('widget_configs')
    .update({ is_default: false })
    .eq('project_id', params.id)
    .eq('channel', channel);

  const { data: inserted, error: insertError } = await supabase
    .from('widget_configs')
    .insert({
      project_id: params.id,
      channel,
      version: nextVersion,
      label: label || `Version ${nextVersion}`,
      config,
      is_default: true,
      created_by: user.id,
    })
    .select('id, channel, version, label, config, is_default, created_at, updated_at')
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: 'Persist failed' }, { status: 400 });
  }

  await supabase
    .from('widget_config_events')
    .insert({
      widget_config_id: inserted.id,
      project_id: params.id,
      user_id: user.id,
      event_type: 'saved',
      metadata: { channel, version: nextVersion, label: inserted.label },
    });

  const response = {
    config: inserted.config || {},
    saved: mapRow(inserted),
    channel,
    warnings,
  };

  return NextResponse.json(response, { status: 200 });
}
