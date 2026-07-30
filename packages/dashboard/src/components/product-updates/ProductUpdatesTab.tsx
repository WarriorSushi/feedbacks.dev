"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CalendarClock,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { UpdatesOnboarding } from "./UpdatesOnboarding";
import { PageHeader } from "@/components/ui/workspace-shell";

type Update = {
  id: string;
  status: "draft" | "published" | "archived";
  version_label: string | null;
  title: string;
  summary: string;
  highlights: string[];
  cta_label: string | null;
  cta_url: string | null;
  imageUrl?: string;
  published_at: string | null;
  expires_at: string | null;
  metrics: { impressions: number; dismissals: number; ctaClicks: number };
};

type Settings = {
  enabled: boolean;
  autoShow: boolean;
  displayDelayMs: number;
  theme: "auto" | "light" | "dark";
  accentColor: string;
  includePaths: string[];
  excludePaths: string[];
  showPoweredBy: boolean;
};

type Entitlements = {
  scheduling: boolean;
  analyticsDays: number;
  activeLimit: number | null;
  customBranding: boolean;
};

type FormValues = {
  versionLabel: string;
  title: string;
  summary: string;
  highlights: string;
  ctaLabel: string;
  ctaUrl: string;
  expiresAt: string;
};

const blankForm: FormValues = {
  versionLabel: "",
  title: "",
  summary: "",
  highlights: "",
  ctaLabel: "",
  ctaUrl: "",
  expiresAt: "",
};

function toForm(update: Update): FormValues {
  return {
    versionLabel: update.version_label || "",
    title: update.title,
    summary: update.summary,
    highlights: update.highlights.join("\n"),
    ctaLabel: update.cta_label || "",
    ctaUrl: update.cta_url || "",
    expiresAt: localDateTime(update.expires_at),
  };
}

function localDateTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function stateLabel(update: Update) {
  if (update.status === "archived") return "Archived";
  if (update.status === "draft") return "Draft";
  if (update.expires_at && new Date(update.expires_at) <= new Date())
    return "Expired";
  if (update.published_at && new Date(update.published_at) > new Date())
    return "Scheduled";
  return "Live";
}

type Modules = { feedback: boolean; updates: boolean };
type EmbedStatus = {
  state: "not_detected" | "connected" | "stale";
  lastSeenAt: string | null;
};

export function ProductUpdatesTab({
  projectId,
  projectKey,
  view = "overview",
  updateId,
}: {
  projectId: string;
  projectKey: string | null;
  view?: "overview" | "composer" | "settings";
  updateId?: string;
}) {
  const router = useRouter();
  const [updates, setUpdates] = React.useState<Update[]>([]);
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [entitlements, setEntitlements] = React.useState<Entitlements | null>(
    null,
  );
  const [form, setForm] = React.useState<FormValues>(blankForm);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [publishAt, setPublishAt] = React.useState("");
  const [previewMobile, setPreviewMobile] = React.useState(false);
  const [previewDark, setPreviewDark] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [modules, setModules] = React.useState<Modules | null>(null);
  const [embedStatus, setEmbedStatus] = React.useState<EmbedStatus | null>(
    null,
  );
  const [privateTestOpen, setPrivateTestOpen] = React.useState(false);
  const [publishConfirmation, setPublishConfirmation] = React.useState<
    "published" | "scheduled" | null
  >(null);
  const selected = updates.find((update) => update.id === selectedId) || null;

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [response, modulesResponse, statusResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}/updates`, { cache: "no-store" }),
        fetch(`/api/projects/${projectId}/modules`, { cache: "no-store" }),
        fetch(`/api/projects/${projectId}/embed-status`, { cache: "no-store" }),
      ]);
      const [data, moduleData, statusData] = await Promise.all([
        response.json(),
        modulesResponse.json(),
        statusResponse.json().catch(() => null),
      ]);
      if (!response.ok)
        throw new Error(data.error || "Unable to load updates for users.");
      if (!modulesResponse.ok)
        throw new Error(moduleData.error || "Unable to load product settings.");
      setUpdates(data.updates || []);
      setSettings(data.settings);
      setEntitlements(data.entitlements);
      setModules(moduleData);
      setEmbedStatus(
        statusResponse.ok && statusData?.state
          ? statusData
          : { state: "not_detected", lastSeenAt: null },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Try again.";
      setLoadError(message);
      toast({
        title: "Could not load updates for users",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    void load();
  }, [load]);
  React.useEffect(() => {
    void fetch(`/api/projects/${projectId}/activation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "updates_nav_opened" }),
    }).catch(() => undefined);
  }, [projectId]);
  React.useEffect(() => {
    if (
      view === "composer" &&
      updateId &&
      updates.some((update) => update.id === updateId)
    )
      edit(updates.find((update) => update.id === updateId)!);
  }, [updateId, updates, view]);

  const updateForm = (key: keyof FormValues, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  function edit(update: Update) {
    setSelectedId(update.id);
    setForm(toForm(update));
    setPublishAt(localDateTime(update.published_at));
  }

  async function request(url: string, options?: RequestInit) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(
        data?.error ||
          Object.values(data?.errors || {}).join(" ") ||
          "Request failed.",
      );
    return data;
  }

  function formBody() {
    return {
      versionLabel: form.versionLabel,
      title: form.title,
      summary: form.summary,
      highlights: form.highlights
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      ctaLabel: form.ctaLabel,
      ctaUrl: form.ctaUrl,
    };
  }

  async function saveDraft() {
    setSaving(true);
    try {
      const body = JSON.stringify(formBody());
      const data = selected
        ? await request(`/api/projects/${projectId}/updates/${selected.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body,
          })
        : await request(`/api/projects/${projectId}/updates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
      if (!selected && data.update?.id) setSelectedId(data.update.id);
      toast({ title: selected ? "Update saved" : "Draft saved" });
      await load();
    } catch (error) {
      toast({
        title: "Could not save draft",
        description:
          error instanceof Error
            ? error.message
            : "Check the fields and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function publish(scheduled = false) {
    if (!selected) return;
    if (scheduled && !publishAt) {
      toast({
        title: "Choose a publication time",
        description: "Scheduling requires a future local date and time.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await request(
        `/api/projects/${projectId}/updates/${selected.id}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publishedAt: scheduled
              ? new Date(publishAt).toISOString()
              : undefined,
            expiresAt: form.expiresAt
              ? new Date(form.expiresAt).toISOString()
              : undefined,
          }),
        },
      );
      toast({
        title: scheduled ? "Update scheduled" : "Update published",
        description: "It is usually visible in the widget within a minute.",
      });
      setPublishConfirmation(scheduled ? "scheduled" : "published");
      await load();
    } catch (error) {
      toast({
        title: "Could not publish release note",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File | undefined) {
    if (!file || !selected) return;
    setSaving(true);
    try {
      await request(`/api/projects/${projectId}/updates/${selected.id}/image`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      toast({ title: "Image uploaded" });
      await load();
    } catch (error) {
      toast({
        title: "Could not upload image",
        description:
          error instanceof Error
            ? error.message
            : "Use JPEG, PNG, or WebP under 2 MB.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(next: Settings) {
    setSettings(next);
    try {
      const result = await request(
        `/api/projects/${projectId}/updates/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        },
      );
      setSettings(result);
    } catch (error) {
      toast({
        title: "Could not save settings",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
      void load();
    }
  }

  function openPrivateTest() {
    setPrivateTestOpen(true);
    void fetch(`/api/projects/${projectId}/activation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "updates_private_test_opened" }),
    }).catch(() => undefined);
  }

  if (loading)
    return (
      <div className="py-8 text-sm text-muted-foreground">
        Loading updates for users…
      </div>
    );
  if (loadError)
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h2 className="text-xl font-semibold">
          Updates for users could not load
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
        <Button className="mt-5" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  if (!modules || !embedStatus || !settings) return null;
  if (
    !settings.enabled ||
    (updates.length === 0 && embedStatus.state !== "connected")
  ) {
    return (
      <UpdatesOnboarding
        projectId={projectId}
        projectKey={projectKey}
        modules={modules}
        embedState={embedStatus.state}
        onRefresh={load}
      />
    );
  }
  if (view === "settings") {
    return (
      <UpdatesSettings
        settings={settings}
        entitlements={entitlements}
        onSave={saveSettings}
        onBack={() => router.push(`/projects/${projectId}/release-notes`)}
      />
    );
  }
  if (view === "overview") {
    return (
      <UpdatesOverview
        updates={updates}
        onNew={() => router.push(`/projects/${projectId}/release-notes/new`)}
        onEdit={(id) =>
          router.push(`/projects/${projectId}/release-notes/${id}`)
        }
        onSettings={() =>
          router.push(`/projects/${projectId}/release-notes/settings`)
        }
        onAction={async (update, action) => {
          if (
            action === "delete" &&
            !window.confirm(`Delete “${update.title}”? This cannot be undone.`)
          )
            return;
          setSaving(true);
          try {
            await request(
              `/api/projects/${projectId}/updates/${update.id}${action === "archive" || action === "restore" ? `/${action}` : ""}`,
              {
                method: action === "delete" ? "DELETE" : "POST",
              },
            );
            toast({
              title:
                action === "delete"
                  ? "Update deleted"
                  : action === "archive"
                    ? "Update archived"
                    : "Update restored",
            });
            await load();
          } catch (error) {
            toast({
              title: `Could not ${action} update`,
              description:
                error instanceof Error ? error.message : "Try again.",
              variant: "destructive",
            });
          } finally {
            setSaving(false);
          }
        }}
        busy={saving}
      />
    );
  }

  if (updateId && !updates.some((update) => update.id === updateId)) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h2 className="text-xl font-semibold">Product update not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted, or the link may be out of date.
        </p>
        <Button
          className="mt-5"
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/release-notes`)}
        >
          Return to updates for users
        </Button>
      </div>
    );
  }

  if (publishConfirmation) {
    const scheduled = publishConfirmation === "scheduled";
    return (
      <>
        <div className="mx-auto max-w-2xl py-8">
          <p className="text-xs font-semibold text-primary">
            Update for your users
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {scheduled ? "Scheduled successfully" : "Published successfully"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {scheduled
              ? `This product update becomes eligible at ${new Date(publishAt).toLocaleString()}.`
              : "This product update is eligible now and will appear on matching pages for visitors who have not seen it."}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={openPrivateTest}>Open private test</Button>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/projects/${projectId}/release-notes`)
              }
            >
              Return to updates for users
            </Button>
          </div>
        </div>
        {privateTestOpen && (
          <PrivateTestDialog
            form={form}
            settings={settings}
            onClose={() => setPrivateTestOpen(false)}
          />
        )}
      </>
    );
  }

  const impressions = selected?.metrics.impressions || 0;
  const ctaRate = impressions
    ? Math.round(((selected?.metrics.ctaClicks || 0) / impressions) * 100)
    : 0;
  const dismissalRate = impressions
    ? Math.round(((selected?.metrics.dismissals || 0) / impressions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold text-primary">
            Update shown to your users
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {selected ? "Edit product update" : "Create product update"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep the announcement concise. You can review it privately before
            publishing.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/release-notes`)}
        >
          Back to updates
        </Button>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {selected ? "Edit release note" : "Draft details"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plain text only. A live release note keeps its existing seen
                  state when edited.
                </p>
              </div>
            </div>
            <div>
              <Field label="Title">
                <Input
                  value={form.title}
                  maxLength={120}
                  onChange={(event) => updateForm("title", event.target.value)}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Summary">
                <Textarea
                  value={form.summary}
                  maxLength={280}
                  rows={3}
                  onChange={(event) =>
                    updateForm("summary", event.target.value)
                  }
                />
              </Field>
            </div>
            <div className="mt-4">
              <Label htmlFor="update-image" className="text-sm">
                Image
              </Label>
              <div className="mt-1 flex items-center gap-3">
                {selected?.imageUrl && (
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    Image uploaded
                  </span>
                )}
                <Input
                  id="update-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={saving || !selected}
                  onChange={(event) =>
                    void uploadImage(event.currentTarget.files?.[0])
                  }
                />
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {selected
                    ? "2 MB max"
                    : "Save the draft before adding an image"}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Field label="Highlights, one per line">
                <Textarea
                  value={form.highlights}
                  rows={5}
                  onChange={(event) =>
                    updateForm("highlights", event.target.value)
                  }
                />
              </Field>
            </div>
            <details className="mt-5 rounded-md border p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Advanced details
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Version label">
                  <Input
                    value={form.versionLabel}
                    maxLength={32}
                    placeholder="v2.4"
                    onChange={(event) =>
                      updateForm("versionLabel", event.target.value)
                    }
                  />
                </Field>
                <Field label="Expires">
                  <Input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      updateForm("expiresAt", event.target.value)
                    }
                  />
                </Field>
                <Field label="CTA label">
                  <Input
                    value={form.ctaLabel}
                    maxLength={40}
                    onChange={(event) =>
                      updateForm("ctaLabel", event.target.value)
                    }
                  />
                </Field>
                <Field label="CTA URL">
                  <Input
                    value={form.ctaUrl}
                    maxLength={2048}
                    placeholder="/new-feature or https://example.com"
                    onChange={(event) =>
                      updateForm("ctaUrl", event.target.value)
                    }
                  />
                </Field>
              </div>
            </details>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => void saveDraft()} disabled={saving}>
                {saving
                  ? "Saving…"
                  : selected?.status === "published"
                    ? "Update live post"
                    : "Save draft"}
              </Button>
              {selected && (
                <Button
                  variant="outline"
                  onClick={openPrivateTest}
                  disabled={saving}
                >
                  Test
                </Button>
              )}
              {selected?.status === "draft" && (
                <Button
                  variant="outline"
                  onClick={() => void publish(false)}
                  disabled={saving}
                >
                  Publish now
                </Button>
              )}
            </div>
            {selected?.status === "draft" && (
              <div className="mt-4 flex flex-wrap items-end gap-2 rounded-md bg-muted/40 p-3">
                <Field label="Publish later" className="min-w-[220px]">
                  <Input
                    type="datetime-local"
                    value={publishAt}
                    disabled={!entitlements?.scheduling}
                    onChange={(event) => setPublishAt(event.target.value)}
                  />
                </Field>
                <Button
                  variant="outline"
                  disabled={saving || !entitlements?.scheduling}
                  onClick={() => void publish(true)}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                {!entitlements?.scheduling && (
                  <p className="pb-2 text-xs text-muted-foreground">
                    Scheduling is available on Pro.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Preview</h3>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={previewMobile ? "outline" : "secondary"}
                  onClick={() => setPreviewMobile(false)}
                >
                  Desktop
                </Button>
                <Button
                  size="sm"
                  variant={previewMobile ? "secondary" : "outline"}
                  onClick={() => setPreviewMobile(true)}
                >
                  Mobile
                </Button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {settings?.theme === "auto"
                  ? "Auto theme"
                  : `${settings?.theme || "Auto"} theme`}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewDark((value) => !value)}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                {previewDark ? "Light" : "Dark"}
              </Button>
            </div>
            <UpdatePreview
              form={form}
              dark={previewDark}
              mobile={previewMobile}
              accent={settings?.accentColor || "#6366f1"}
            />
            <Button
              className="mt-3 w-full"
              variant="outline"
              onClick={openPrivateTest}
            >
              Open private test
            </Button>
          </section>
          {selected && (
            <section className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="font-semibold">Approximate metrics</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Last {entitlements?.analyticsDays || 7} days, aggregate only.
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Views" value={impressions} />
                <Metric label="CTR" value={`${ctaRate}%`} />
                <Metric label="Dismissed" value={`${dismissalRate}%`} />
              </dl>
            </section>
          )}
          <Button
            className="w-full"
            variant="ghost"
            onClick={() =>
              router.push(`/projects/${projectId}/release-notes/settings`)
            }
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Release note settings
          </Button>
        </aside>
      </div>
      {privateTestOpen && (
        <PrivateTestDialog
          form={form}
          settings={settings}
          onClose={() => setPrivateTestOpen(false)}
        />
      )}
    </div>
  );
}

function UpdatesOverview({
  updates,
  onNew,
  onEdit,
  onSettings,
  onAction,
  busy,
}: {
  updates: Update[];
  onNew: () => void;
  onEdit: (id: string) => void;
  onSettings: () => void;
  onAction: (
    update: Update,
    action: "archive" | "restore" | "delete",
  ) => Promise<void>;
  busy: boolean;
}) {
  if (!updates.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="text-xs font-semibold text-primary">
            Updates for your users
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
            Tell users what just improved
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Publish a “What’s new” popup inside your product. Your shared embed
            is already connected, so publishing here requires no code change.
          </p>
        </section>
        <section className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h3 className="text-lg font-semibold">
            Create the first product update
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with a title and summary. Add an image or delivery rules only
            if they help.
          </p>
          <Button className="mt-5" onClick={onNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create first update
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Inside your product"
        title="Updates for your users"
        description="Publish concise “What’s new” messages through the connected embed."
        action={
          <div className="flex gap-2">
          <Button variant="outline" onClick={onSettings}>
            <Settings2 className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={onNew}>
            <Plus className="mr-2 h-4 w-4" />
            New product update
          </Button>
          </div>
        }
      />
      <div className="divide-y overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
        {updates.map((update) => (
          <div
            key={update.id}
            className="flex min-h-20 items-center gap-2 p-2 sm:p-3"
          >
            <button
              className="min-w-0 flex-1 rounded-md p-2 text-left hover:bg-muted/40"
              onClick={() => onEdit(update.id)}
            >
              <span className="flex items-center gap-2">
                <span className="truncate font-medium">
                  {update.version_label ? `${update.version_label} · ` : ""}
                  {update.title}
                </span>
                <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {stateLabel(update)} ·{" "}
                {update.published_at
                  ? new Date(update.published_at).toLocaleDateString()
                  : "Not published"}{" "}
                · {update.metrics.impressions} views ·{" "}
                {update.metrics.ctaClicks} CTA clicks ·{" "}
                {update.metrics.dismissals} dismissals
              </span>
            </button>
            <div className="flex shrink-0 gap-1">
              {update.status === "archived" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  aria-label={`Restore ${update.title}`}
                  onClick={() => void onAction(update, "restore")}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  aria-label={`Archive ${update.title}`}
                  onClick={() => void onAction(update, "archive")}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                aria-label={`Delete ${update.title}`}
                onClick={() => void onAction(update, "delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpdatesSettings({
  settings,
  entitlements,
  onSave,
  onBack,
}: {
  settings: Settings;
  entitlements: Entitlements | null;
  onSave: (settings: Settings) => Promise<void>;
  onBack: () => void;
}) {
  const [draft, setDraft] = React.useState(settings);
  const delaySeconds = draft.displayDelayMs / 1000;
  const hasCustomDelay = ![0, 3, 5].includes(delaySeconds);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div>
          <p className="text-xs font-semibold text-primary">
            Updates for your users
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
            Display settings
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Control how “What’s new” announcements appear inside your product.
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to updates
        </Button>
      </section>
      <div className="space-y-5 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <Check
          label="Show product updates to users"
          value={draft.enabled}
          onChange={(enabled) => setDraft({ ...draft, enabled })}
        />
        <Check
          label="Auto-show the newest unseen update"
          value={draft.autoShow}
          onChange={(autoShow) => setDraft({ ...draft, autoShow })}
        />
        <Field label="Appearance">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={draft.theme}
            onChange={(event) =>
              setDraft({
                ...draft,
                theme: event.target.value as Settings["theme"],
              })
            }
          >
            <option value="auto">Match visitor device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
        <Field label="Show after">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={delaySeconds}
            onChange={(event) =>
              setDraft({
                ...draft,
                displayDelayMs: Number(event.target.value) * 1000,
              })
            }
          >
            {hasCustomDelay && (
              <option value={delaySeconds}>
                {delaySeconds} seconds (current)
              </option>
            )}
            <option value="0">Immediately</option>
            <option value="3">3 seconds</option>
            <option value="5">5 seconds</option>
          </select>
        </Field>
        <Field label="Accent color">
          <Input
            value={draft.accentColor}
            onChange={(event) =>
              setDraft({ ...draft, accentColor: event.target.value })
            }
          />
        </Field>
        <details className="rounded-md border p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Page targeting
          </summary>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Use pathname prefixes such as /dashboard or /settings. Leave both
            lists empty to show updates everywhere.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Show on specific pages">
              <Textarea
                rows={4}
                placeholder={"/dashboard\n/changelog"}
                value={draft.includePaths.join("\n")}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    includePaths: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Hide on specific pages">
              <Textarea
                rows={4}
                placeholder={"/checkout\n/admin"}
                value={draft.excludePaths.join("\n")}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    excludePaths: event.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </div>
        </details>
        <Check
          label="Show feedbacks.dev branding"
          value={draft.showPoweredBy}
          disabled={!entitlements?.customBranding}
          onChange={(showPoweredBy) => setDraft({ ...draft, showPoweredBy })}
        />
        <Button onClick={() => void onSave(draft)}>Save settings</Button>
      </div>
    </div>
  );
}

function PrivateTestDialog({
  form,
  settings,
  onClose,
}: {
  form: FormValues;
  settings: Settings;
  onClose: () => void;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const previousFocus = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();
    return () => previousFocus.current?.focus();
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) || [],
    ).filter((element) => !element.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Private release note test"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Private test
            </p>
            <h3 className="mt-1 font-semibold">Visitor preview</h3>
          </div>
          <Button
            ref={closeRef}
            size="sm"
            variant="ghost"
            aria-label="Close private test"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <UpdatePreview
          form={form}
          dark={settings.theme === "dark"}
          mobile={false}
          accent={settings.accentColor}
        />
        <p className="mt-4 text-xs text-muted-foreground">
          Only you can see this preview. Nothing has been published by opening
          it.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className || ""}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Check({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2 text-sm ${disabled ? "text-muted-foreground" : ""}`}
    >
      <input
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold">{value}</dd>
    </div>
  );
}

function UpdatePreview({
  form,
  dark,
  mobile,
  accent,
}: {
  form: FormValues;
  dark: boolean;
  mobile: boolean;
  accent: string;
}) {
  return (
    <div
      className={`mx-auto mt-4 rounded-lg border p-5 shadow-sm ${mobile ? "max-w-[280px]" : ""} ${dark ? "border-slate-700 bg-slate-950 text-slate-100" : "bg-white text-slate-900"}`}
    >
      <p
        className="text-xs font-semibold uppercase tracking-[0.12em]"
        style={{ color: accent }}
      >
        {form.versionLabel || "What’s New"}
      </p>
      <h4 className="mt-2 text-lg font-semibold">
        {form.title || "Your release note title"}
      </h4>
      <p
        className={`mt-2 text-sm leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}
      >
        {form.summary || "A concise summary of the release appears here."}
      </p>
      {form.highlights && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {form.highlights
            .split("\n")
            .filter(Boolean)
            .map((item) => (
              <li key={item}>{item}</li>
            ))}
        </ul>
      )}
      {form.ctaLabel && (
        <span
          className="mt-4 inline-flex rounded-md px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          {form.ctaLabel}
        </span>
      )}
    </div>
  );
}
