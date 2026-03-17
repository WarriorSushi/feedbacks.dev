"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';

type Provider = 'none' | 'turnstile' | 'hcaptcha';

export function ProjectSettingsSheet({
  projectId,
  projectName,
  open,
  onOpenChange,
}: {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>('none');
  const [turnstileKey, setTurnstileKey] = useState('');
  const [hcaptchaKey, setHcaptchaKey] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const canDelete = useMemo(() => deleteConfirm.trim() === projectName.trim(), [deleteConfirm, projectName]);

  useEffect(() => {
    if (!open) return;
    // Load current defaults from the latest widget config to prefill
    (async () => {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/widget-config`);
        if (!res.ok) return;
        const body = await res.json();
        const cfg = (body?.config || {}) as Record<string, any>;
        const prov = (cfg.captchaProvider as Provider) || 'none';
        setProvider(prov);
        setTurnstileKey(String(cfg.turnstileSiteKey || ''));
        setHcaptchaKey(String(cfg.hcaptchaSiteKey || ''));
      } catch {}
    })();
  }, [open, projectId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        requireCaptcha: provider !== 'none',
        captchaProvider: provider,
        turnstileSiteKey: provider === 'turnstile' ? (turnstileKey || '') : '',
        hcaptchaSiteKey: provider === 'hcaptcha' ? (hcaptchaKey || '') : '',
      };
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/widget-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: payload, label: 'Project settings update' }),
      });
      if (!res.ok) throw new Error('Save failed');
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onOpenChange(false);
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Project settings</SheetTitle>
          <SheetDescription>Settings apply to {projectName} only.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          <div className="space-y-2">
            <Label>Captcha provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Disabled</SelectItem>
                <SelectItem value="turnstile">Turnstile</SelectItem>
                <SelectItem value="hcaptcha">hCaptcha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {provider === 'turnstile' && (
            <div className="space-y-2">
              <Label>Turnstile site key</Label>
              <Input value={turnstileKey} onChange={(e) => setTurnstileKey(e.target.value)} placeholder="0xAAAA..." />
            </div>
          )}
          {provider === 'hcaptcha' && (
            <div className="space-y-2">
              <Label>hCaptcha site key</Label>
              <Input value={hcaptchaKey} onChange={(e) => setHcaptchaKey(e.target.value)} placeholder="10000000-ffff-ffff-ffff-000000000001" />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Close</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Delete project</Label>
            <p className="text-xs text-muted-foreground">Type <strong>{projectName}</strong> to confirm deletion. This action cannot be undone.</p>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={projectName} />
            <Button variant="destructive" disabled={!canDelete || loading} onClick={handleDelete}>Delete project</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

