"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Eye, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { UpdatesOnboarding } from "./UpdatesOnboarding";
import { formatVersionEtag } from "@/lib/optimistic-concurrency";
import { ProductUpdatesOverview } from "./ProductUpdatesOverview";
import { ProductUpdatesSettings } from "./ProductUpdatesSettings";
import {
  ProductUpdateField,
  ProductUpdateMetric,
  ProductUpdatePreview,
  ProductUpdatePrivateTestDialog,
} from "./ProductUpdatePresentation";
import {
  blankProductUpdateForm,
  localDateTime,
  toProductUpdateForm,
  type ProductEmbedStatus,
  type ProductModules,
  type ProductUpdate,
  type ProductUpdateEntitlements,
  type ProductUpdateForm,
  type ProductUpdateSettings,
} from "./product-update-model";

type Update = ProductUpdate;
type Settings = ProductUpdateSettings;
type Entitlements = ProductUpdateEntitlements;
type FormValues = ProductUpdateForm;
type Modules = ProductModules;
type EmbedStatus = ProductEmbedStatus;

export function ProductUpdatesTab({
  projectId,
  projectKey,
  view = "overview",
  updateId,
}: {
  projectId: string;
  projectKey: string;
  view?: "overview" | "composer" | "settings";
  updateId?: string;
}) {
  const router = useRouter();
  const [updates, setUpdates] = React.useState<Update[]>([]);
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [settingsVersion, setSettingsVersion] = React.useState<string | null>(
    null,
  );
  const [entitlements, setEntitlements] = React.useState<Entitlements | null>(
    null,
  );
  const [form, setForm] = React.useState<FormValues>(blankProductUpdateForm);
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
      setSettingsVersion(data.settingsVersion || null);
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
    setForm(toProductUpdateForm(update));
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
      imageAltText: form.imageAltText,
    };
  }

  async function saveDraft() {
    setSaving(true);
    try {
      const body = JSON.stringify(formBody());
      const data = selected
        ? await request(`/api/projects/${projectId}/updates/${selected.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "If-Match": formatVersionEtag(selected.updated_at),
            },
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
          headers: {
            "Content-Type": "application/json",
            "If-Match": formatVersionEtag(selected.updated_at),
          },
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
        headers: {
          "Content-Type": file.type,
          "If-Match": formatVersionEtag(selected.updated_at),
        },
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
            : "Use JPEG or PNG under 2 MB.",
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
          headers: {
            "Content-Type": "application/json",
            ...(settingsVersion
              ? { "If-Match": formatVersionEtag(settingsVersion) }
              : {}),
          },
          body: JSON.stringify(next),
        },
      );
      setSettings(result.settings);
      setSettingsVersion(result.settingsVersion);
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
      <div
        aria-busy="true"
        aria-label="Loading product updates"
        className="space-y-5"
      >
        <span className="sr-only">Loading updates for users…</span>
        <div className="rounded-lg border bg-card p-6">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-7 w-64 max-w-full animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-muted/70" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3 rounded-lg border bg-card p-6">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted/70" />
            <div className="h-24 w-full animate-pulse rounded bg-muted/70" />
          </div>
          <div className="h-72 animate-pulse rounded-lg border bg-card" />
        </div>
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
      <ProductUpdatesSettings
        settings={settings}
        entitlements={entitlements}
        onSave={saveSettings}
        onBack={() => router.push(`/projects/${projectId}/release-notes`)}
      />
    );
  }
  if (view === "overview") {
    return (
      <ProductUpdatesOverview
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
                headers: {
                  "If-Match": formatVersionEtag(update.updated_at),
                },
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
            await load();
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
          <ProductUpdatePrivateTestDialog
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
              <ProductUpdateField label="Title">
                <Input
                  value={form.title}
                  maxLength={120}
                  onChange={(event) => updateForm("title", event.target.value)}
                />
              </ProductUpdateField>
            </div>
            <div className="mt-4">
              <ProductUpdateField label="Summary">
                <Textarea
                  value={form.summary}
                  maxLength={280}
                  rows={3}
                  onChange={(event) =>
                    updateForm("summary", event.target.value)
                  }
                />
              </ProductUpdateField>
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
                  accept="image/jpeg,image/png"
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
              {selected?.imageUrl && (
                <div className="mt-3">
                  <ProductUpdateField label="Image description">
                    <Input
                      value={form.imageAltText}
                      maxLength={160}
                      placeholder="Describe the image, or leave blank if it is decorative"
                      onChange={(event) =>
                        updateForm("imageAltText", event.target.value)
                      }
                    />
                  </ProductUpdateField>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used by screen readers. Leave blank only when the image adds no information.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <ProductUpdateField label="Highlights, one per line">
                <Textarea
                  value={form.highlights}
                  rows={5}
                  onChange={(event) =>
                    updateForm("highlights", event.target.value)
                  }
                />
              </ProductUpdateField>
            </div>
            <details className="mt-5 rounded-md border p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Advanced details
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ProductUpdateField label="Version label">
                  <Input
                    value={form.versionLabel}
                    maxLength={32}
                    placeholder="v2.4"
                    onChange={(event) =>
                      updateForm("versionLabel", event.target.value)
                    }
                  />
                </ProductUpdateField>
                <ProductUpdateField label="Expires">
                  <Input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      updateForm("expiresAt", event.target.value)
                    }
                  />
                </ProductUpdateField>
                <ProductUpdateField label="CTA label">
                  <Input
                    value={form.ctaLabel}
                    maxLength={40}
                    onChange={(event) =>
                      updateForm("ctaLabel", event.target.value)
                    }
                  />
                </ProductUpdateField>
                <ProductUpdateField label="CTA URL">
                  <Input
                    value={form.ctaUrl}
                    maxLength={2048}
                    placeholder="/new-feature or https://example.com"
                    onChange={(event) =>
                      updateForm("ctaUrl", event.target.value)
                    }
                  />
                </ProductUpdateField>
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
                <ProductUpdateField
                  label="Publish later"
                  className="min-w-[220px]"
                >
                  <Input
                    type="datetime-local"
                    value={publishAt}
                    disabled={!entitlements?.scheduling}
                    onChange={(event) => setPublishAt(event.target.value)}
                  />
                </ProductUpdateField>
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
            <ProductUpdatePreview
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
                <ProductUpdateMetric label="Views" value={impressions} />
                <ProductUpdateMetric label="CTR" value={`${ctaRate}%`} />
                <ProductUpdateMetric
                  label="Dismissed"
                  value={`${dismissalRate}%`}
                />
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
        <ProductUpdatePrivateTestDialog
          form={form}
          settings={settings}
          onClose={() => setPrivateTestOpen(false)}
        />
      )}
    </div>
  );
}
