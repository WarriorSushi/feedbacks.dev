"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Eye,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { UpdatesOnboarding } from "./UpdatesOnboarding";
import { ProductUpdateImageEditor } from "./ProductUpdateImageEditor";
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

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

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
  const [imageStatus, setImageStatus] = React.useState<{
    kind: "idle" | "uploading" | "success" | "error";
    message?: string;
  }>({ kind: "idle" });
  const [pendingImage, setPendingImage] = React.useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );
  const editorRef = React.useRef<HTMLElement>(null);
  const advancedRef = React.useRef<HTMLDetailsElement>(null);
  const [modules, setModules] = React.useState<Modules | null>(null);
  const [embedStatus, setEmbedStatus] = React.useState<EmbedStatus | null>(
    null,
  );
  const [privateTestOpen, setPrivateTestOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(view === "settings");
  const [publishConfirmation, setPublishConfirmation] = React.useState<
    "published" | "scheduled" | null
  >(null);
  const selected = updates.find((update) => update.id === selectedId) || null;

  React.useEffect(() => {
    if (view === "settings") setSettingsOpen(true);
  }, [view]);

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

  const updateForm = (
    key: Exclude<keyof FormValues, "ctas">,
    value: string,
  ) => {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateCta = (
    index: number,
    key: "label" | "url",
    value: string,
  ) => {
    setFieldErrors((current) => {
      if (!current.ctas && !current.cta) return current;
      const next = { ...current };
      delete next.ctas;
      delete next.cta;
      return next;
    });
    setForm((current) => ({
      ...current,
      ctas: current.ctas.map((cta, ctaIndex) =>
        ctaIndex === index ? { ...cta, [key]: value } : cta,
      ),
    }));
  };

  function edit(update: Update) {
    setSelectedId(update.id);
    setForm(toProductUpdateForm(update));
    setPublishAt(localDateTime(update.published_at));
  }

  async function request(url: string, options?: RequestInit) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errors =
        data?.errors && typeof data.errors === "object"
          ? Object.fromEntries(
              Object.entries(data.errors).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === "string",
              ),
            )
          : {};
      const fieldMessage = Object.values(errors).join(" ");
      throw new ApiRequestError(
        data?.error ||
          fieldMessage ||
          (response.status >= 500
            ? "A temporary service problem prevented this save. Your draft is still in the editor; wait a moment and try again."
            : "The server rejected this request. Your draft is still in the editor; reload the latest version and try again."),
        errors,
      );
    }
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
      ctas: form.ctas,
      imageAltText: form.imageAltText,
    };
  }

  async function saveDraft() {
    setSaving(true);
    setFieldErrors({});
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
      if (!selected && data.update?.id) {
        setSelectedId(data.update.id);
        router.replace(`/projects/${projectId}/release-notes/${data.update.id}`);
      }
      toast({ title: selected ? "Update saved" : "Draft saved" });
      await load();
    } catch (error) {
      const errors =
        error instanceof ApiRequestError ? error.fieldErrors : {};
      setFieldErrors(errors);
      if (Object.keys(errors).some((key) => ["versionLabel", "expiresAt", "ctas", "cta"].includes(key))) {
        if (advancedRef.current) advancedRef.current.open = true;
      }
      if (Object.keys(errors).length) {
        requestAnimationFrame(() => {
          const invalid = editorRef.current?.querySelector<HTMLElement>(
            '[data-field-error="true"] input, [data-field-error="true"] textarea, [data-field-error="true"] select',
          );
          invalid?.focus();
          invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
      toast({
        title: "Could not save draft",
        description: Object.keys(errors).length
          ? "Correct the highlighted fields. Your draft is still in the editor."
          : error instanceof Error
            ? error.message
            : "Your draft is still in the editor. Try again.",
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
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setImageStatus({
        kind: "error",
        message: "Choose a JPEG or PNG image.",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageStatus({
        kind: "error",
        message: `This image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Choose one under 2 MB.`,
      });
      setPendingImage(null);
      return;
    }
    setSaving(true);
    setImageStatus({
      kind: "uploading",
      message: `Uploading ${file.name}…`,
    });
    try {
      const result = await request(
        `/api/projects/${projectId}/updates/${selected.id}/image`,
        {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "If-Match": formatVersionEtag(selected.updated_at),
        },
        body: file,
        },
      );
      setUpdates((current) =>
        current.map((update) =>
          update.id === selected.id
            ? { ...update, ...result.update }
            : update,
        ),
      );
      setImageStatus({
        kind: "success",
        message: `${file.name} uploaded successfully.`,
      });
      setPendingImage(null);
      toast({
        title: "Image uploaded",
        description: "The preview now shows the saved image.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Use a JPEG or PNG image under 2 MB.";
      setImageStatus({ kind: "error", message });
      toast({
        title: "Could not upload image",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function prepareImage(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setImageStatus({ kind: "error", message: "Choose a JPEG or PNG image." });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setImageStatus({
        kind: "error",
        message: "Choose an image under 20 MB, then crop and resize it before upload.",
      });
      return;
    }
    setImageStatus({
      kind: "idle",
      message: `${file.name} is ready to crop and resize.`,
    });
    setPendingImage(file);
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
      toast({ title: "Display settings saved" });
      return true;
    } catch (error) {
      toast({
        title: "Could not save settings",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
      void load();
      return false;
    }
  }

  function closeSettings() {
    setSettingsOpen(false);
    if (view === "settings") {
      router.replace(`/projects/${projectId}/release-notes`);
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
  const settingsPanel = settingsOpen ? (
    <ProductUpdatesSettings
      settings={settings}
      entitlements={entitlements}
      onSave={saveSettings}
      onClose={closeSettings}
    />
  ) : null;

  if (view === "overview" || view === "settings") {
    return (
      <>
        <ProductUpdatesOverview
          updates={updates}
          onNew={() => router.push(`/projects/${projectId}/release-notes/new`)}
          onEdit={(id) =>
            router.push(`/projects/${projectId}/release-notes/${id}`)
          }
          onSettings={() => setSettingsOpen(true)}
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
        {settingsPanel}
      </>
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Display settings
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}/release-notes`)}
          >
            Back to updates
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section ref={editorRef} className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
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
              <ProductUpdateField label="Title" error={fieldErrors.title}>
                <Input
                  aria-invalid={Boolean(fieldErrors.title)}
                  value={form.title}
                  maxLength={120}
                  onChange={(event) => updateForm("title", event.target.value)}
                />
              </ProductUpdateField>
            </div>
            <div className="mt-4">
              <ProductUpdateField label="Summary" error={fieldErrors.summary}>
                <Textarea
                  aria-invalid={Boolean(fieldErrors.summary)}
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
                <Input
                  id="update-image"
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={saving || !selected}
                  onChange={(event) => {
                    prepareImage(event.currentTarget.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {selected
                    ? "Edit files up to 20 MB; uploads are limited to 2 MB"
                    : "Save the draft before adding an image"}
                </span>
              </div>
              <p
                className={`mt-2 text-xs ${
                  imageStatus.kind === "error"
                    ? "text-destructive"
                    : imageStatus.kind === "success"
                      ? "text-primary"
                      : "text-muted-foreground"
                }`}
                role={imageStatus.kind === "error" ? "alert" : "status"}
              >
                {imageStatus.message ||
                  (selected?.imageUrl
                    ? "An image is saved and shown below."
                    : "JPEG or PNG, up to 2 MB.")}
              </p>
              {pendingImage ? (
                <ProductUpdateImageEditor
                  file={pendingImage}
                  busy={saving}
                  onCancel={() => setPendingImage(null)}
                  onApply={uploadImage}
                />
              ) : null}
              {selected?.imageUrl && (
                <div className="mt-3 space-y-3">
                  {/* Dynamic Supabase URLs are user-owned content and bypass optimization. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.imageUrl}
                    alt={form.imageAltText || "Current product update image"}
                    className="aspect-video w-full max-w-md rounded-md border object-cover"
                  />
                  <ProductUpdateField label="Image description" error={fieldErrors.imageAltText}>
                    <Input
                      aria-invalid={Boolean(fieldErrors.imageAltText)}
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
              <ProductUpdateField label="Highlights, one per line" error={fieldErrors.highlights}>
                <Textarea
                  aria-invalid={Boolean(fieldErrors.highlights)}
                  value={form.highlights}
                  rows={5}
                  onChange={(event) =>
                    updateForm("highlights", event.target.value)
                  }
                />
              </ProductUpdateField>
            </div>
            <details ref={advancedRef} className="mt-5 rounded-md border p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Advanced details
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ProductUpdateField label="Version label" error={fieldErrors.versionLabel}>
                  <Input
                    aria-invalid={Boolean(fieldErrors.versionLabel)}
                    value={form.versionLabel}
                    maxLength={32}
                    placeholder="v2.4"
                    onChange={(event) =>
                      updateForm("versionLabel", event.target.value)
                    }
                  />
                </ProductUpdateField>
                <ProductUpdateField label="Expires" error={fieldErrors.expiresAt}>
                  <Input
                    aria-invalid={Boolean(fieldErrors.expiresAt)}
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      updateForm("expiresAt", event.target.value)
                    }
                  />
                </ProductUpdateField>
              </div>
              <div
                data-field-error={fieldErrors.ctas || fieldErrors.cta ? "true" : undefined}
                className={`mt-5 border-t pt-4 ${fieldErrors.ctas || fieldErrors.cta ? "rounded-md bg-destructive/10 p-3 ring-1 ring-destructive/70" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Action buttons</p>
                    <p className="text-xs text-muted-foreground">
                      Add up to four links. The first is the primary action.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={form.ctas.length >= 4}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        ctas: [...current.ctas, { label: "", url: "" }],
                      }))
                    }
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add button
                  </Button>
                </div>
                <div className="mt-3 space-y-3">
                  {form.ctas.map((cta, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto]"
                    >
                      <ProductUpdateField label={`Button ${index + 1} label`}>
                        <Input
                          aria-invalid={Boolean(fieldErrors.ctas || fieldErrors.cta)}
                          value={cta.label}
                          maxLength={40}
                          onChange={(event) =>
                            updateCta(index, "label", event.target.value)
                          }
                        />
                      </ProductUpdateField>
                      <ProductUpdateField label={`Button ${index + 1} URL`}>
                        <Input
                          aria-invalid={Boolean(fieldErrors.ctas || fieldErrors.cta)}
                          value={cta.url}
                          maxLength={2048}
                          placeholder="/new-feature or https://example.com"
                          onChange={(event) =>
                            updateCta(index, "url", event.target.value)
                          }
                        />
                      </ProductUpdateField>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="self-end"
                        aria-label={`Remove button ${index + 1}`}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            ctas: current.ctas.filter(
                              (_, ctaIndex) => ctaIndex !== index,
                            ),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {fieldErrors.ctas || fieldErrors.cta ? (
                  <p className="mt-2 text-xs font-medium text-destructive" role="alert">
                    {fieldErrors.ctas || fieldErrors.cta}
                  </p>
                ) : null}
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
            onClick={() => setSettingsOpen(true)}
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
      {settingsPanel}
    </div>
  );
}
