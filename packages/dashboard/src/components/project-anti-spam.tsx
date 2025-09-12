"use client";

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ProjectAntiSpam({ projectId }: { projectId: string }) {
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const [provider, setProvider] = useState<'none'|'turnstile'|'hcaptcha'>('none');
  const [tsKey, setTsKey] = useState('');
  const [hcKey, setHcKey] = useState('');
  const [msg, setMsg] = useState('');
  const [ready, setReady] = useState<{ turnstile: boolean; hcaptcha: boolean } | null>(null);
  const [rateCount, setRateCount] = useState<string>('5');
  const [rateWindow, setRateWindow] = useState<string>('60');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/projects/${projectId}/widget-config`);
        const j = r.ok ? await r.json() : {};
        setRequireCaptcha(!!j.requireCaptcha);
        setProvider(j.captchaProvider || 'none');
        setTsKey(j.turnstileSiteKey || '');
        setHcKey(j.hcaptchaSiteKey || '');
        if (j.rateLimitCount) setRateCount(String(j.rateLimitCount));
        if (j.rateLimitWindowSec) setRateWindow(String(j.rateLimitWindowSec));
      } catch {}
      try { const rr = await fetch('/api/settings/anti-spam/ready'); if (rr.ok) setReady(await rr.json()); } catch {}
    })();
  }, [projectId]);

  const save = async () => {
    setMsg('');
    try {
      const r = await fetch(`/api/projects/${projectId}/widget-config`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requireCaptcha, captchaProvider: provider !== 'none' ? provider : undefined, turnstileSiteKey: tsKey || undefined, hcaptchaSiteKey: hcKey || undefined, rateLimitCount: rateCount ? Number(rateCount) : undefined, rateLimitWindowSec: rateWindow ? Number(rateWindow) : undefined }),
      });
      setMsg(r.ok ? 'Saved' : 'Save failed');
    } catch { setMsg('Save failed'); }
  };
  const loadDefaults = async () => {
    try { const r = await fetch('/api/settings/anti-spam'); if (r.ok) { const j = await r.json(); setProvider(j.defaultProvider || 'none'); setTsKey(j.turnstileSiteKey || ''); setHcKey(j.hcaptchaSiteKey || ''); } } catch {}
  };

  return (
    <div className="space-y-3">
      {requireCaptcha && provider !== 'none' && ready && ((provider === 'turnstile' && !ready.turnstile) || (provider === 'hcaptcha' && !ready.hcaptcha)) && (
        <div className="text-sm text-destructive border border-destructive/40 rounded p-2">Server secret for {provider} is missing. Set it in Vercel env variables to enforce captcha.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Require Captcha</Label>
          <Select value={requireCaptcha ? 'yes' : 'no'} onValueChange={(v)=>setRequireCaptcha(v==='yes')}>
            <SelectTrigger>
              <SelectValue placeholder="Require Captcha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={(v)=>setProvider(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="turnstile">Cloudflare Turnstile</SelectItem>
              <SelectItem value="hcaptcha">hCaptcha</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end"><Button variant="outline" onClick={loadDefaults}>Load Defaults</Button></div>
      </div>
      {provider === 'turnstile' && (
        <div className="space-y-2">
          <Label>Turnstile Site Key</Label>
          <Input placeholder="0xAAAA..." value={tsKey} onChange={(e)=>setTsKey(e.target.value)} />
        </div>
      )}
      {provider === 'hcaptcha' && (
        <div className="space-y-2">
          <Label>hCaptcha Site Key</Label>
          <Input placeholder="10000000-ffff-ffff-ffff-000000000001" value={hcKey} onChange={(e)=>setHcKey(e.target.value)} />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Rate limit count</Label>
          <Input type="number" min={0} value={rateCount} onChange={(e)=>setRateCount(e.target.value)} placeholder="5" />
        </div>
        <div className="space-y-2">
          <Label>Rate limit window (sec)</Label>
          <Input type="number" min={1} value={rateWindow} onChange={(e)=>setRateWindow(e.target.value)} placeholder="60" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={save}>Save</Button>
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </div>
      <p className="text-xs text-muted-foreground">Note: Server must have the matching secret env configured to verify tokens.</p>
    </div>
  );
}
