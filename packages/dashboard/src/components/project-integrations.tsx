"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Link as LinkIcon, Trash2, Plus, ChevronDown } from 'lucide-react';

type RuleConfig = { ratingMax?: number; types?: Array<'bug'|'idea'|'praise'>; tagsInclude?: string[] };
type EndpointBase = { id: string; url: string; enabled: boolean; delivery?: 'immediate'|'digest'; digestInterval?: 'hourly'; rules?: RuleConfig };
type SlackEndpoint = EndpointBase;
type DiscordEndpoint = EndpointBase;
type GenericEndpoint = EndpointBase & { secret?: string };

type WebhookCfg = {
  slack?: { endpoints?: SlackEndpoint[] } | { url?: string; enabled?: boolean };
  discord?: { endpoints?: DiscordEndpoint[] } | { url?: string; enabled?: boolean };
  generic?: { endpoints?: GenericEndpoint[] } | { url?: string; enabled?: boolean; secret?: string };
};

interface ProjectIntegrationsProps {
  projectId: string;
}

export function ProjectIntegrations({ projectId }: ProjectIntegrationsProps) {
  const [cfg, setCfg] = useState<WebhookCfg>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<{ [k: string]: boolean }>({});
  const [message, setMessage] = useState<string>('');
  const [logs, setLogs] = useState<Array<any>>([]);
  const [digestLogs, setDigestLogs] = useState<Array<any>>([]);
  const [reveal, setReveal] = useState<{[k:string]: boolean}>({});
  const [resending, setResending] = useState<{[id:string]: boolean}>({});
  const [logEndpointFilter, setLogEndpointFilter] = useState<string>('');
  const [logEventFilter, setLogEventFilter] = useState<string>('');
  const [logSince, setLogSince] = useState<string>('');
  const [logUntil, setLogUntil] = useState<string>('');
  const [logPage, setLogPage] = useState<number>(1);
  const [logTotal, setLogTotal] = useState<number>(0);
  const [logPageSize] = useState<number>(25);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/projects/${projectId}/webhooks`);
        const data = r.ok ? await r.json() : {};
        if (!mounted) return;
        setCfg(data || {});
      } finally {
        setLoading(false);
      }
    };
    const loadLogs = async () => {
      const qs = new URLSearchParams();
      if (logEndpointFilter) qs.set('endpoint_id', logEndpointFilter);
      if (logEventFilter) qs.set('event', logEventFilter);
      if (logSince) qs.set('since', logSince);
      if (logUntil) qs.set('until', logUntil);
      qs.set('page', String(logPage));
      qs.set('pageSize', String(logPageSize));
      const r = await fetch(`/api/projects/${projectId}/webhooks/logs?` + qs.toString());
      const data = r.ok ? await r.json() : { items: [], total: 0, page: 1 };
      if (!mounted) return;
      setLogs(Array.isArray(data.items) ? data.items : []);
      setLogTotal(typeof data.total === 'number' ? data.total : 0);
    };
    const loadDigestLogs = async () => {
      const r = await fetch(`/api/projects/${projectId}/webhooks/logs?event=feedbacks.digest`);
      const data = r.ok ? await r.json() : { items: [] };
      if (!mounted) return;
      setDigestLogs(Array.isArray(data.items) ? data.items : []);
    };
    load();
    loadLogs();
    loadDigestLogs();
    const t = setInterval(() => { loadLogs(); loadDigestLogs(); }, 15000);
    return () => { mounted = false; clearInterval(t); };
  }, [projectId, logEndpointFilter, logEventFilter, logSince, logUntil, logPage, logPageSize]);

  // Normalize config to arrays for UI
  const toArray = (x: any) => (Array.isArray(x) ? x : []);
  const makeId = (seed: string) => 'u-' + Math.random().toString(36).slice(2, 10);
  const ensureArrays = (c: WebhookCfg): WebhookCfg => {
    const next: any = { ...(c as any) };
    // Always ensure container objects exist
    if (!next.slack) next.slack = { endpoints: [] };
    if (!next.discord) next.discord = { endpoints: [] };
    if (!next.generic) next.generic = { endpoints: [] };
    // Back-compat: transform legacy single-url shapes to arrays
    if ((c as any).slack && !(c as any).slack.endpoints) {
      const url = (c as any).slack.url; const enabled = (c as any).slack.enabled;
      next.slack = { endpoints: url ? [{ id: makeId('slack'), url, enabled: !!enabled, delivery: 'immediate', events: ['created'] }] : [] };
    }
    if ((c as any).discord && !(c as any).discord.endpoints) {
      const url = (c as any).discord.url; const enabled = (c as any).discord.enabled;
      next.discord = { endpoints: url ? [{ id: makeId('discord'), url, enabled: !!enabled, delivery: 'immediate', events: ['created'] }] : [] };
    }
    if ((c as any).generic && !(c as any).generic.endpoints) {
      const url = (c as any).generic.url; const enabled = (c as any).generic.enabled; const secret = (c as any).generic.secret;
      next.generic = { endpoints: url ? [{ id: makeId('generic'), url, enabled: !!enabled, delivery: 'immediate', secret, events: ['created'] }] : [] };
    }
    return next as WebhookCfg;
  };
  const cfgArrays = ensureArrays(cfg);

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const r = await fetch(`/api/projects/${projectId}/webhooks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfgArrays || {}),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setMessage(data?.error ? `Save failed: ${data.error}` : 'Save failed');
      } else {
        setMessage('Saved');
      }
    } catch (e: any) {
      setMessage(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const endpointListGitHub = () => {
    const key = 'github' as const;
    const items = toArray((cfgArrays as any)[key]?.endpoints) as Array<any>;
    const updateEndpoint = (idx: number, patch: any) => setCfg((c) => {
      const next = ensureArrays({ ...(c as any) });
      (next as any)[key] = (next as any)[key] || { endpoints: [] };
      const arr = toArray((next as any)[key].endpoints);
      arr[idx] = { ...arr[idx], ...patch };
      (next as any)[key].endpoints = arr;
      return next;
    });
    const addEndpoint = () => setCfg((c) => {
      const next = ensureArrays({ ...(c as any) });
      (next as any)[key] = (next as any)[key] || { endpoints: [] };
      const arr = toArray((next as any)[key].endpoints);
      arr.push({ id: makeId('gh'), repo: '', token: '', labels: '', enabled: true, delivery: 'immediate' });
      (next as any)[key].endpoints = arr;
      return next;
    });
    const removeEndpoint = (idx: number) => setCfg((c) => {
      const next = ensureArrays({ ...(c as any) });
      (next as any)[key] = (next as any)[key] || { endpoints: [] };
      const arr = toArray((next as any)[key].endpoints);
      arr.splice(idx, 1);
      (next as any)[key].endpoints = arr;
      return next;
    });

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>GitHub Issues</span>
            <Button size="sm" variant="outline" className="gap-1" onClick={addEndpoint}><Plus className="h-3 w-3" /> Add</Button>
          </CardTitle>
          <CardDescription>Create issues in a repo on new feedback.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">No endpoints. Click Add to create one.</div>
          )}
          {items.map((ep, idx) => (
            <div key={ep.id || idx} className="border rounded p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Endpoint {idx+1}</div>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeEndpoint(idx)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Repository (owner/repo)</Label>
                  <Input value={ep.repo || ''} onChange={(e)=>updateEndpoint(idx, { repo: e.target.value })} placeholder="owner/repo" />
                </div>
                <div>
                  <Label>Personal Access Token</Label>
                  <Input type="password" value={ep.token || ''} onChange={(e)=>updateEndpoint(idx, { token: e.target.value })} placeholder="ghp_..." />
                </div>
                <div className="sm:col-span-2">
                  <Label>Labels (comma-separated)</Label>
                  <Input value={ep.labels || ''} onChange={(e)=>updateEndpoint(idx, { labels: e.target.value })} placeholder="feedback, bug" />
                </div>
                <div className="flex items-center justify-between rounded border p-2 sm:col-span-2">
                  <div>
                    <div className="text-sm font-medium">Enabled</div>
                    <div className="text-xs text-muted-foreground">Trigger on new feedback</div>
                  </div>
                  <Switch checked={!!ep.enabled} onCheckedChange={(b)=>updateEndpoint(idx, { enabled: b })} />
                </div>
              </div>
            </div>
          ))}
          <div className="text-xs text-muted-foreground">Token requires repo scope. Title/body include message, rating, URL, and email if present.</div>
        </CardContent>
      </Card>
    );
  };
  const testKind = async (kind: 'slack'|'discord'|'generic'|'github', endpointId?: string) => {
    setTesting((m) => ({ ...m, [kind]: true }));
    setMessage('');
    try {
      const r = await fetch(`/api/projects/${projectId}/webhooks/test?kind=${kind}${endpointId ? `&endpoint=${encodeURIComponent(endpointId)}` : ''}`, { method: 'POST' });
      setMessage(r.ok ? `Test ${kind} webhook sent` : `Test ${kind} failed`);
    } catch (e: any) {
      setMessage(e?.message || `Test ${kind} failed`);
    } finally {
      setTesting((m) => ({ ...m, [kind]: false }));
    }
  };

  const validateUrl = (u?: string) => {
    if (!u) return { ok: true };
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== 'https:') return { ok: false, reason: 'HTTPS required' };
      return { ok: true };
    } catch {
      return { ok: false, reason: 'Invalid URL' };
    }
  };

  const lastByEndpoint = useMemo(() => {
    const map: Record<string, { when?: string; status?: string; ms?: number }> = {};
    for (const l of logs) {
      if (!l.endpoint_id) continue;
      if (!map[l.endpoint_id]) map[l.endpoint_id] = { when: l.created_at, status: l.status, ms: l.response_time_ms };
    }
    return map;
  }, [logs]);

  const timeAgo = (d?: string) => {
    if (!d) return 'Never';
    const date = new Date(d).getTime();
    const mins = Math.floor((Date.now() - date) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const masked = (u?: string) => {
    if (!u) return '';
    if (reveal[u]) return u;
    const max = 36;
    if (u.length <= max) return u.replace(/.(?=.{4})/g, 'â€¢');
    const head = u.slice(0, 16);
    const tail = u.slice(-8);
    return `${head}â€¦${tail}`;
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setMessage('Copied'); } catch {}
  };

  const curlFor = (key: 'slack'|'discord'|'generic', url?: string) => {
    if (key === 'slack') return `curl -X POST -H "Content-Type: application/json" -d '{"text":"Hello from feedbacks.dev"}' "${url || (cfg.slack && 'url' in cfg.slack ? cfg.slack.url : undefined) || 'https://hooks.slack.com/services/...'}"`;
    if (key === 'discord') return `curl -X POST -H "Content-Type: application/json" -d '{"content":"Hello from feedbacks.dev","username":"feedbacks.dev"}' "${url || (cfg.discord && 'url' in cfg.discord ? cfg.discord.url : undefined) || 'https://discord.com/api/webhooks/...'}"`;
    // generic
    const payload = {
      event: 'feedbacks.created',
      project_id: 'project-id',
      project: 'Project Name',
      feedback: { id: 'uuid', created_at: new Date().toISOString(), message: 'message', email: 'user@example.com', url: 'https://example.com', type: 'bug', rating: 2, priority: 'high', tags: ['tag'], screenshot_url: null, attachments: null }
    };
    return `curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify(payload)}' "${url || (cfg.generic && 'url' in cfg.generic ? cfg.generic.url : undefined) || 'https://example.com/webhook'}"`;
  };

  const previewFor = (key: 'slack'|'discord') => {
    const text = `${'Project'}: ${'[bug] '}New feedback message (rating 4/5)`;
    return (
      <div className="text-sm border rounded p-3 bg-muted/30">
        {key === 'slack' ? <div className="font-mono">{JSON.stringify({text})}</div> : <div className="font-mono">{JSON.stringify({content: text, username: 'feedbacks.dev'})}</div>}
        <div className="text-xs text-muted-foreground mt-1">Preview</div>
      </div>
    );
  };

  const endpointList = (label: string, key: 'slack'|'discord'|'generic', placeholder: string, hint?: string) => {
    const items = toArray((cfgArrays as any)[key]?.endpoints) as Array<any>;
    const updateEndpoint = (idx: number, patch: any) => setCfg((c) => {
      const next = ensureArrays({ ...(c as any) });
      (next as any)[key] = (next as any)[key] || { endpoints: [] };
      const arr = toArray((next as any)[key].endpoints);
      arr[idx] = { ...arr[idx], ...patch };
      (next as any)[key].endpoints = arr;
      return next;
    });
    const addEndpoint = () => setCfg((c) => {
      const next = ensureArrays({ ...(c as any) });
      (next as any)[key] = (next as any)[key] || { endpoints: [] };
      const arr = toArray((next as any)[key].endpoints);
      arr.push({ id: makeId('new'), url: '', enabled: true, delivery: 'immediate' });
      (next as any)[key].endpoints = arr;
      return next;
    });
    const removeEndpoint = (idx: number) => setCfg((c) => {
      const next = ensureArrays({ ...(c as any) });
      (next as any)[key] = (next as any)[key] || { endpoints: [] };
      const arr = toArray((next as any)[key].endpoints);
      arr.splice(idx, 1);
      (next as any)[key].endpoints = arr;
      return next;
    });

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{label}</span>
            <Button size="sm" variant="outline" className="gap-1" onClick={addEndpoint}><Plus className="h-3 w-3" /> Add</Button>
          </CardTitle>
          {hint && <CardDescription>{hint}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground">No endpoints. Click Add to create one.</div>
          )}
          {items.map((ep, idx) => {
            const v = validateUrl(ep.url);
            const last = lastByEndpoint[ep.id || ''] || {};
            const rules = ep.rules || {} as any;
            return (
              <div key={ep.id || idx} className="border rounded p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Endpoint {idx+1}</div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeEndpoint(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <Label>Webhook URL</Label>
                    <div className="flex items-center gap-2">
                      <Input value={ep.url} placeholder={placeholder} onChange={(e)=>updateEndpoint(idx, { url: e.target.value })} className={v.ok ? '' : 'border-destructive focus-visible:ring-destructive'} />
                      {ep.url && (
                        <Button type="button" variant="outline" className="shrink-0" onClick={() => setReveal((m)=>({ ...m, [ep.url]: !m[ep.url] }))}>
                          {reveal[ep.url] ? 'Hide' : 'Reveal'}
                        </Button>
                      )}
                    </div>
                    {!v.ok && <div className="text-xs text-destructive mt-1">{v.reason}</div>}
                    {ep.url && !reveal[ep.url] && <div className="text-xs text-muted-foreground mt-1 break-all">{masked(ep.url)}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!ep.enabled} onCheckedChange={(b)=>updateEndpoint(idx, { enabled: b })} />
                    <Label className="text-sm">Enabled</Label>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Events</Label>
                      <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={Array.isArray(ep.events) ? ep.events.includes('created') : (ep.delivery !== 'digest')} onChange={(e)=>{
                        const set = new Set(ep.events || (ep.delivery === 'digest' ? ['digest'] : ['created']));
                        if (e.target.checked) set.add('created'); else set.delete('created');
                        updateEndpoint(idx, { events: Array.from(set) });
                      }} /> On new feedback</label>
                      <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={Array.isArray(ep.events) ? ep.events.includes('updated') : false} onChange={(e)=>{
                        const set = new Set(ep.events || (ep.delivery === 'digest' ? ['digest'] : ['created']));
                        if (e.target.checked) set.add('updated'); else set.delete('updated');
                        updateEndpoint(idx, { events: Array.from(set) });
                      }} /> On feedbacks update</label>
                      <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={Array.isArray(ep.events) ? ep.events.includes('digest') : (ep.delivery === 'digest')} onChange={(e)=>{
                        const set = new Set(ep.events || (ep.delivery === 'digest' ? ['digest'] : ['created']));
                        if (e.target.checked) set.add('digest'); else set.delete('digest');
                        updateEndpoint(idx, { events: Array.from(set) });
                      }} /> Hourly digest</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => testKind(key, ep.id)} disabled={testing[key] || !ep.enabled || !ep.url}>Test</Button>
                      <Button variant="outline" onClick={() => copy(curlFor(key, ep.url))}>Copy curl</Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input placeholder="e.g. Product Slack" value={ep.name || ''} onChange={(e)=>updateEndpoint(idx, { name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Rate limit (per minute)</Label>
                    <Input type="number" min={0} placeholder="0 = unlimited" value={typeof ep.rateLimitPerMin === 'number' ? ep.rateLimitPerMin : ''} onChange={(e)=>updateEndpoint(idx, { rateLimitPerMin: e.target.value ? Number(e.target.value) : undefined })} />
                  </div>
                  <div className="flex items-center gap-3 mt-6 sm:mt-7">
                    <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={!!ep?.redact?.email} onChange={(e)=>updateEndpoint(idx, { redact: { ...(ep.redact||{}), email: e.target.checked } })} /> Redact email</label>
                    <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={!!ep?.redact?.url} onChange={(e)=>updateEndpoint(idx, { redact: { ...(ep.redact||{}), url: e.target.checked } })} /> Redact URL</label>
                  </div>
                  {(key === 'slack' || key === 'discord') && (
                    <div>
                      <Label>Format</Label>
                      <select className="border rounded h-8 px-2 text-sm mt-1" value={ep.format || 'rich'} onChange={(e)=>updateEndpoint(idx, { format: e.target.value })}>
                        <option value="rich">Rich</option>
                        <option value="compact">Compact</option>
                      </select>
                    </div>
                  )}
                </div>

                {key === 'generic' && (
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1">
                      <Label>Signing Secret (optional)</Label>
                      <Input value={ep.secret || ''} placeholder="Used to sign requests" onChange={(e)=>updateEndpoint(idx, { secret: e.target.value })} />
                      <div className="text-xs text-muted-foreground mt-1">Adds X-Feedbacks-Timestamp and X-Feedbacks-Signature headers</div>
                    </div>
                  </div>
                )}

                <details>
                  <summary className="cursor-pointer text-sm text-muted-foreground flex items-center gap-1"><ChevronDown className="h-3 w-3" /> Rules (optional)</summary>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label>Rating max</Label>
                      <Input type="number" min={1} max={5} value={typeof rules.ratingMax === 'number' ? rules.ratingMax : ''} onChange={(e)=>updateEndpoint(idx, { rules: { ...rules, ratingMax: e.target.value ? Number(e.target.value) : undefined } })} />
                    </div>
                    <div>
                      <Label>Types</Label>
                      <div className="flex flex-wrap gap-2 text-sm mt-1">
                        {(['bug','idea','praise'] as const).map(t => (
                          <label key={t} className="flex items-center gap-1">
                            <input type="checkbox" checked={Array.isArray(rules.types) ? rules.types.includes(t) : false} onChange={(e)=>{
                              const cur = new Set(rules.types||[]); if (e.target.checked) cur.add(t); else cur.delete(t); updateEndpoint(idx, { rules: { ...rules, types: Array.from(cur) } });
                            }} /> {t}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Tags include</Label>
                      <Input placeholder="comma,separated,tags" value={(rules.tagsInclude||[]).join(',')} onChange={(e)=>updateEndpoint(idx, { rules: { ...rules, tagsInclude: e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean) } })} />
                    </div>
                  </div>
                </details>

                {(key === 'slack' || key === 'discord') && (
                  <div>
                    <Label>Preview</Label>
                    <div className="mt-1 text-xs text-muted-foreground">Example of how the message will appear</div>
                    <div className="mt-2">{previewFor(key)}</div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const ok = (last as any).status === 'success';
                      return (
                        <>
                          <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-muted-foreground">Last sent: {timeAgo((last as any).when)}{typeof (last as any).ms === 'number' ? ` â€¢ ${(last as any).ms}ms` : ''}</span>
                        </>
                      );
                    })()}
                  </div>
                  {(() => {
                    const list = logs.filter(l => l.endpoint_id === ep.id);
                    const total = list.length || 1;
                    const successes = list.filter(l => l.status === 'success').length;
                    let consec = 0; for (const l of list) { if (l.status === 'failed') consec++; else break; }
                    const unhealthy = consec >= 3;
                    return (
                      <div className="text-xs text-muted-foreground">
                        Health: <span className={unhealthy ? 'text-destructive' : 'text-green-600'}>{unhealthy ? `Unhealthy (${consec} fails)` : 'Healthy'}</span> â€¢ Success: {Math.round((successes/total)*100)}%
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-sm text-muted-foreground">Loadingâ€¦</div>
      ) : (
        <>
          {endpointList('Slack', 'slack', 'https://hooks.slack.com/services/...', 'Sends a simple text message')}
          {endpointList('Discord', 'discord', 'https://discord.com/api/webhooks/...', 'Sends a message via Discord webhook')}
          {endpointList('Generic POST', 'generic', 'https://example.com/webhook', 'POSTs a JSON payload on events')}
          {endpointListGitHub()}

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Saved per project. Toggle to enable delivery.</div>
            <Button onClick={onSave} disabled={saving}>{saving ? 'Savingâ€¦' : 'Save'}</Button>
          </div>
          {message && <div className="text-sm">{message}</div>}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Deliveries</CardTitle>
              <CardDescription>Filter, paginate, and export webhook deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <Label>Endpoint</Label>
                  <select className="w-full border rounded h-8 px-2 text-sm" value={logEndpointFilter} onChange={(e)=>{ setLogEndpointFilter(e.target.value); setLogPage(1); }}>
                    <option value="">All</option>
                    {(['slack','discord','generic','github'] as const).map(kind => (
                      (toArray((cfgArrays as any)[kind]?.endpoints) as any[]).map(ep => (
                        <option key={ep.id} value={ep.id}>{ep.name || ep.url}</option>
                      ))
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Event</Label>
                  <select className="border rounded h-8 px-2 text-sm" value={logEventFilter} onChange={(e)=>{ setLogEventFilter(e.target.value); setLogPage(1); }}>
                    <option value="">All</option>
                    <option value="feedbacks.created">feedbacks.created</option>
                    <option value="feedbacks.updated">feedbacks.updated</option>
                    <option value="feedbacks.digest">feedbacks.digest</option>
                  </select>
                </div>
                <div>
                  <Label>Since</Label>
                  <Input type="datetime-local" value={logSince} onChange={(e)=>{ setLogSince(e.target.value); setLogPage(1); }} />
                </div>
                <div>
                  <Label>Until</Label>
                  <Input type="datetime-local" value={logUntil} onChange={(e)=>{ setLogUntil(e.target.value); setLogPage(1); }} />
                </div>
                <div className="flex items-end">
                  <a
                    className="inline-flex items-center px-3 h-8 border rounded text-sm"
                    href={(() => { const qs = new URLSearchParams(); if (logEndpointFilter) qs.set('endpoint_id', logEndpointFilter); if (logEventFilter) qs.set('event', logEventFilter); if (logSince) qs.set('since', logSince); if (logUntil) qs.set('until', logUntil); return `/api/projects/${projectId}/webhooks/logs.csv?` + qs.toString(); })()}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Export CSV
                  </a>
                </div>
              </div>
              {logs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No deliveries yet.</div>
              ) : (
                <div className="space-y-2">
                  {logs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-2 text-sm border rounded p-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant={l.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                          {l.status}
                        </Badge>
                        <span className="text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</span>
                        <span className="truncate">{l.event} â†’ {l.kind}</span>
                        {typeof l.response_time_ms === 'number' && <span className="text-xs text-muted-foreground whitespace-nowrap">â€¢ {l.response_time_ms}ms</span>}
                        {typeof l.status_code === 'number' && <span className="text-xs text-muted-foreground whitespace-nowrap">â€¢ {l.status_code}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {l.status === 'failed' && (
                          <Button size="sm" variant="outline" disabled={!!resending[l.id]} onClick={async ()=>{
                            setResending(m=>({ ...m, [l.id]: true }));
                            try {
                              const r = await fetch(`/api/projects/${projectId}/webhooks/resend/${l.id}`, { method: 'POST' });
                              setMessage(r.ok ? 'Resent' : 'Resend failed');
                              // refresh logs
                              const rl = await fetch(`/api/projects/${projectId}/webhooks/logs`);
                              const data = rl.ok ? await rl.json() : { items: [] };
                              setLogs(Array.isArray(data.items) ? data.items : []);
                            } finally {
                              setResending(m=>({ ...m, [l.id]: false }));
                            }
                          }}>
                            {resending[l.id] ? 'Resendingâ€¦' : 'Resend'}
                          </Button>
                        )}
                        {l.url && (
                          <a href={l.url} className="inline-flex items-center gap-1 text-xs underline" target="_blank" rel="noreferrer">
                            <LinkIcon className="h-3 w-3" />
                            URL
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-3 text-sm">
                <div>Page {logPage}{logTotal ? ` of ${Math.max(1, Math.ceil(logTotal / logPageSize))}` : ''}</div>
                <div className="space-x-2">
                  <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={logPage <= 1} onClick={()=>setLogPage(p=>Math.max(1,p-1))}>Prev</button>
                  <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={(logPage * logPageSize) >= logTotal} onClick={()=>setLogPage(p=>p+1)}>Next</button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Digest History</CardTitle>
              <CardDescription>Hourly digests (last 25)</CardDescription>
            </CardHeader>
            <CardContent>
              {digestLogs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No digests yet.</div>
              ) : (
                <div className="space-y-2">
                  {digestLogs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-2 text-sm border rounded p-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant={l.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                          {l.status}
                        </Badge>
                        <span className="text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</span>
                        <span className="truncate">{l.event} â†’ {l.kind}</span>
                        {typeof l.response_time_ms === 'number' && <span className="text-xs text-muted-foreground whitespace-nowrap">â€¢ {l.response_time_ms}ms</span>}
                        {typeof l.status_code === 'number' && <span className="text-xs text-muted-foreground whitespace-nowrap">â€¢ {l.status_code}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {l.url && (
                          <a href={l.url} className="inline-flex items-center gap-1 text-xs underline" target="_blank" rel="noreferrer">
                            <LinkIcon className="h-3 w-3" />
                            URL
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}



