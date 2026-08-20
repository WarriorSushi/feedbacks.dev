"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dismissToast, toast } from "@/hooks/use-toast";
import { UpdatesOnboarding } from "./UpdatesOnboarding";
import { ProductUpdateImageEditor } from "./ProductUpdateImageEditor";
import {
  MUTATION_VERSION_HEADER,
  mutationVersionHeaders,
  parseIfMatchVersion,
} from "@/lib/optimistic-concurrency";
import { ProductUpdatesOverview } from "./ProductUpdatesOverview";
import { ProductUpdatesSettings } from "./ProductUpdatesSettings";
import { ProductUpdateVisibilityToggle } from "./ProductUpdateVisibilityToggle";
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
    readonly code?: string,
    readonly currentVersion?: string,
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
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pendingListActions, setPendingListActions] = React.useState<
    Record<string, "archive" | "restore" | "delete" | "visibility">
  >({});
  const [imageStatus, setImageStatus] = React.useState<{
    kind: "idle" | "uploading" | "success" | "error";
    message?: string;
  }>({ kind: "idle" });
  const [pendingImage, setPendingImage] = React.useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = React.useState<
    string | null
  >(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );
  const [editorConflict, setEditorConflict] = React.useState<string | null>(
    null,
  );
  const editorRef = React.useRef<HTMLElement>(null);
  const advancedRef = React.useRef<HTMLDetailsElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const hydratedUpdateRef = React.useRef<string | null>(null);
  const savedFormRef = React.useRef<FormValues | null>(null);
  const selectedVersionRef = React.useRef<string | null>(null);
  const conflictToastIdRef = React.useRef<string | null>(null);
  const hasLoadedRef = React.useRef(false);
  const [modules, setModules] = React.useState<Modules | null>(null);
  const [embedStatus, setEmbedStatus] = React.useState<EmbedStatus | null>(
    null,
  );
  const [privateTestOpen, setPrivateTestOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(view === "settings");
  const [publishConfirmation, setPublishConfirmation] = React.useState<
    "published" | "scheduled" | null
  >(null);
  const [publishReview, setPublishReview] = React.useState<
    "now" | "scheduled" | null
  >(null);
  const [deletedToOverview, setDeletedToOverview] = React.useState(false);
  const [deleteReview, setDeleteReview] = React.useState(false);
  const [removeImageReview, setRemoveImageReview] = React.useState(false);
  const selected = updates.find((update) => update.id === selectedId) || null;

  const mergeSavedUpdate = React.useCallback((saved: Partial<Update> & { id: string }) => {
    setUpdates((current) => {
      const existing = current.find((item) => item.id === saved.id);
      if (!existing) {
        return [{
          ...saved,
          metrics: saved.metrics || { impressions: 0, dismissals: 0, ctaClicks: 0 },
        } as Update, ...current];
      }
      return current.map((item) =>
        item.id === saved.id
          ? { ...item, ...saved, metrics: saved.metrics || item.metrics }
          : item,
      );
    });
  }, []);

  React.useEffect(() => {
    if (view === "settings") setSettingsOpen(true);
  }, [view]);

  const load = React.useCallback(async ({ foreground = false }: { foreground?: boolean } = {}) => {
    const showForeground = foreground || !hasLoadedRef.current;
    if (showForeground) setLoading(true);
    else setRefreshing(true);
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
      hasLoadedRef.current = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Try again.";
      if (showForeground) setLoadError(message);
      toast({
        title: showForeground
          ? "Could not load updates for users"
          : "Could not refresh updates",
        description: showForeground
          ? message
          : "The current list is still available. Try syncing again in a moment.",
        variant: "destructive",
      });
    } finally {
      if (showForeground) setLoading(false);
      else setRefreshing(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    void load({ foreground: true });
  }, [load]);
  React.useEffect(() => {
    void fetch(`/api/projects/${projectId}/activation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "updates_nav_opened" }),
    }).catch(() => undefined);
  }, [projectId]);
  React.useEffect(() => {
    const update = updates.find((item) => item.id === updateId);
    if (
      view === "composer" &&
      updateId &&
      update &&
      hydratedUpdateRef.current !== updateId
    ) {
      edit(update);
    }
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
    const nextForm = toProductUpdateForm(update);
    hydratedUpdateRef.current = update.id;
    setSelectedId(update.id);
    savedFormRef.current = nextForm;
    selectedVersionRef.current = update.updated_at;
    setForm(nextForm);
    setPublishAt(localDateTime(update.published_at));
    setEditorConflict(null);
    setPublishReview(null);
    if (conflictToastIdRef.current) {
      dismissToast(conflictToastIdRef.current);
      conflictToastIdRef.current = null;
    }
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
      const isEditConflict = response.status === 409 || response.status === 412;
      throw new ApiRequestError(
        data?.error ||
          fieldMessage ||
          (isEditConflict
            ? "A newer saved version is available. Your text is still in the editor. Reload the saved version, review your changes, then save again."
            : response.status >= 500
            ? "A temporary service problem prevented this save. Your draft is still in the editor; wait a moment and try again."
            : "The server rejected this request. Your draft is still in the editor; reload the latest version and try again."),
        errors,
        typeof data?.code === "string"
          ? data.code
          : isEditConflict
            ? "EDIT_CONFLICT"
            : undefined,
        typeof data?.currentVersion === "string"
          ? data.currentVersion
          : parseIfMatchVersion(response.headers.get("etag")) || undefined,
      );
    }
    return data;
  }

  function captureEditConflict(error: unknown) {
    if (!(error instanceof ApiRequestError) || error.code !== "EDIT_CONFLICT")
      return false;
    setEditorConflict(error.message);
    if (conflictToastIdRef.current) {
      dismissToast(conflictToastIdRef.current);
    }
    conflictToastIdRef.current = toast({
      title: "Reload required before more changes",
      description:
        "Your text is safe. Use the recovery bar at the bottom of the screen to load the latest saved version.",
      variant: "destructive",
    });
    return true;
  }

  async function requestWithFreshVersion(
    // Media and confirmed destructive actions can be retried without replacing editor text.
    url: string,
    options: RequestInit,
  ): Promise<{ data: unknown; recoveredFromConflict: boolean }> {
    try {
      return { data: await request(url, options), recoveredFromConflict: false };
    } catch (error) {
      if (
        !(error instanceof ApiRequestError) ||
        error.code !== "EDIT_CONFLICT" ||
        !error.currentVersion
      ) {
        throw error;
      }
      const headers = new Headers(options.headers);
      headers.set(MUTATION_VERSION_HEADER, error.currentVersion);
      return {
        data: await request(url, { ...options, headers }),
        recoveredFromConflict: true,
      };
    }
  }

  function hasUnsavedEditorChanges() {
    const saved = savedFormRef.current;
    if (!saved) return false;
    const comparable = (value: FormValues) => ({
      versionLabel: value.versionLabel,
      title: value.title,
      summary: value.summary,
      highlights: value.highlights,
      ctas: value.ctas,
      expiresAt: value.expiresAt,
      imageAltText: value.imageAltText,
    });
    return JSON.stringify(comparable(form)) !== JSON.stringify(comparable(saved));
  }

  function applyMediaMutation(
    update: Partial<Update>,
    recoveredFromConflict: boolean,
  ) {
    if (!selected) return;
    const next = { ...selected, ...update };
    if (typeof update.updated_at === "string") {
      selectedVersionRef.current = update.updated_at;
    }
    setUpdates((current) =>
      current.map((item) =>
        item.id === selected.id ? { ...item, ...update } : item,
      ),
    );
    if (!recoveredFromConflict) return;
    if (hasUnsavedEditorChanges()) {
      captureEditConflict(
        new ApiRequestError(
          "The media change was saved against a newer version, but this editor still contains unsaved text.",
          {},
          "EDIT_CONFLICT",
          next.updated_at,
        ),
      );
      return;
    }
    edit(next);
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
              ...mutationVersionHeaders(
                selectedVersionRef.current || selected.updated_at,
              ),
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
        window.history.replaceState(
          null,
          "",
          `/projects/${projectId}/release-notes/${data.update.id}`,
        );
      }
      if (typeof data.update?.updated_at === "string") {
        selectedVersionRef.current = data.update.updated_at;
        mergeSavedUpdate(data.update);
      }
      toast({ title: selected ? "Release note saved" : "Draft saved" });
      savedFormRef.current = {
        ...form,
        ctas: form.ctas.map((cta) => ({ ...cta })),
      };
      setEditorConflict(null);
      if (conflictToastIdRef.current) {
        dismissToast(conflictToastIdRef.current);
        conflictToastIdRef.current = null;
      }
    } catch (error) {
      const conflicted = captureEditConflict(error);
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
      if (!conflicted) {
        toast({
          title: "Could not save draft",
          description: Object.keys(errors).length
            ? "Correct the highlighted fields. Your draft is still in the editor."
            : error instanceof Error
              ? error.message
              : "Your draft is still in the editor. Try again.",
          variant: "destructive",
        });
      }
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
      const data = await request(
        `/api/projects/${projectId}/updates/${selected.id}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...mutationVersionHeaders(
              selectedVersionRef.current || selected.updated_at,
            ),
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
      if (typeof data.update?.updated_at === "string") {
        selectedVersionRef.current = data.update.updated_at;
        mergeSavedUpdate(data.update);
      }
      toast({
        title: scheduled ? "Update scheduled" : "Update published",
        description: "It is usually visible in the widget within a minute.",
      });
      setPublishConfirmation(scheduled ? "scheduled" : "published");
      setPublishReview(null);
    } catch (error) {
      if (!captureEditConflict(error)) {
        toast({
          title: "Could not publish release note",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  function reviewPublish(scheduled: boolean) {
    if (scheduled && !publishAt) {
      toast({
        title: "Choose a publication time",
        description: "Scheduling requires a future local date and time.",
        variant: "destructive",
      });
      return;
    }
    setPublishReview(scheduled ? "scheduled" : "now");
  }

  async function setUpdateVisibility(update: Update, enabled: boolean) {
    const previousEnabled = update.is_enabled;
    setPendingListActions((current) => ({ ...current, [update.id]: "visibility" }));
    setUpdates((current) =>
      current.map((item) =>
        item.id === update.id ? { ...item, is_enabled: enabled } : item,
      ),
    );
    try {
      const data = await request(
        `/api/projects/${projectId}/updates/${update.id}/visibility`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...mutationVersionHeaders(update.updated_at),
          },
          body: JSON.stringify({ enabled }),
        },
      );
      const nextUpdate = {
        ...update,
        ...data.update,
        metrics: update.metrics,
      } as Update;
      setUpdates((current) =>
        current.map((item) => (item.id === update.id ? nextUpdate : item)),
      );
      if (selectedId === update.id) {
        selectedVersionRef.current = nextUpdate.updated_at;
      }
      toast({
        title: enabled ? "Release note turned on" : "Release note turned off",
        description: enabled
          ? "Eligible visitors can see it again. People who already saw it will not be notified again."
          : "It is hidden from customer embeds. Its content, metrics, and seen state are preserved.",
      });
    } catch (error) {
      const conflicted = selectedId === update.id && captureEditConflict(error);
      if (!conflicted) {
        setUpdates((current) =>
          current.map((item) =>
            item.id === update.id
              ? { ...item, is_enabled: previousEnabled }
              : item,
          ),
        );
        toast({
          title: "Could not change release-note visibility",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "destructive",
        });
        void load();
      }
    } finally {
      setPendingListActions((current) => {
        const next = { ...current };
        delete next[update.id];
        return next;
      });
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
      const mutation = await requestWithFreshVersion(
        `/api/projects/${projectId}/updates/${selected.id}/image`,
        {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          ...mutationVersionHeaders(
            selectedVersionRef.current || selected.updated_at,
          ),
        },
        body: file,
        },
      );
      const result = mutation.data as { update: Partial<Update> };
      applyMediaMutation(result.update, mutation.recoveredFromConflict);
      if (typeof result.update.imageUrl === "string") {
        setForm((current) => ({
          ...current,
          imageUrl: result.update.imageUrl as string,
        }));
      }
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
      const conflicted = captureEditConflict(error);
      const message =
        error instanceof Error
          ? error.message
          : "Use a JPEG or PNG image under 2 MB.";
      setImageStatus({ kind: "error", message });
      if (!conflicted) {
        toast({
          title: "Could not upload image",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  function prepareImage(file: File | undefined) {
    if (!file) return;
    setPendingImage(null);
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

  async function reloadSavedVersion() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const result = await request(
        `/api/projects/${projectId}/updates/${selectedId}`,
        { cache: "no-store" },
      );
      const currentMetrics =
        updates.find((update) => update.id === selectedId)?.metrics ||
        { impressions: 0, dismissals: 0, ctaClicks: 0 };
      const latest = { ...result.update, metrics: currentMetrics } as Update;
      setUpdates((current) =>
        current.map((update) => (update.id === latest.id ? latest : update)),
      );
      edit(latest);
      setPendingImage(null);
      setImageStatus({
        kind: "idle",
        message: "Latest saved version loaded.",
      });
      setFieldErrors({});
      toast({ title: "Latest saved version loaded" });
    } catch (error) {
      toast({
        title: "Could not reload the saved version",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeImage() {
    if (!selected?.imageUrl) return;
    setSaving(true);
    try {
      const mutation = await requestWithFreshVersion(
        `/api/projects/${projectId}/updates/${selected.id}/image`,
        {
          method: "DELETE",
          headers: mutationVersionHeaders(
            selectedVersionRef.current || selected.updated_at,
          ),
        },
      );
      const result = mutation.data as { update: Partial<Update> };
      applyMediaMutation(result.update, mutation.recoveredFromConflict);
      setForm((current) => ({ ...current, imageUrl: "" }));
      setRemoveImageReview(false);
      setImageStatus({ kind: "success", message: "Image removed." });
      toast({ title: "Image removed" });
    } catch (error) {
      if (!captureEditConflict(error)) {
        toast({
          title: "Could not remove image",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelectedUpdate() {
    if (!selected) return;
    setSaving(true);
    try {
      await requestWithFreshVersion(
        `/api/projects/${projectId}/updates/${selected.id}`,
        {
          method: "DELETE",
          headers: mutationVersionHeaders(
            selectedVersionRef.current || selected.updated_at,
          ),
        },
      );
      setUpdates((current) => current.filter((item) => item.id !== selected.id));
      setSelectedId(null);
      setDeletedToOverview(true);
      setDeleteReview(false);
      toast({ title: "Release note deleted" });
      window.history.replaceState(null, "", `/projects/${projectId}/release-notes`);
    } catch (error) {
      if (!captureEditConflict(error)) {
        toast({
          title: "Could not delete release note",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "destructive",
        });
      }
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
              ? mutationVersionHeaders(settingsVersion)
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
      window.history.replaceState(null, "", `/projects/${projectId}/release-notes`);
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

  if (deletedToOverview || view === "overview" || view === "settings") {
    return (
      <>
        <ProductUpdatesOverview
          updates={updates}
          onNew={() => router.push(`/projects/${projectId}/release-notes/new`)}
          onEdit={(id) =>
            router.push(`/projects/${projectId}/release-notes/${id}`)
          }
          onSettings={() => setSettingsOpen(true)}
          onVisibilityChange={setUpdateVisibility}
          onAction={async (update, action) => {
            setPendingListActions((current) => ({ ...current, [update.id]: action }));
            try {
              const result = await request(
                `/api/projects/${projectId}/updates/${update.id}${action === "archive" || action === "restore" ? `/${action}` : ""}`,
                {
                  method: action === "delete" ? "DELETE" : "POST",
                  headers: {
                    ...mutationVersionHeaders(update.updated_at),
                  },
                },
              );
              if (action === "delete") {
                setUpdates((current) =>
                  current.filter((item) => item.id !== update.id),
                );
              } else if (result.update) {
                mergeSavedUpdate({
                  ...update,
                  ...result.update,
                  metrics: update.metrics,
                });
              }
              toast({
                title:
                  action === "delete"
                    ? "Update deleted"
                    : action === "archive"
                      ? "Update archived"
                      : "Update restored",
              });
            } catch (error) {
              toast({
                title: `Could not ${action} update`,
                description:
                  error instanceof Error ? error.message : "Try again.",
                variant: "destructive",
              });
              void load();
            } finally {
              setPendingListActions((current) => {
                const next = { ...current };
                delete next[update.id];
                return next;
              });
            }
          }}
          pendingActions={pendingListActions}
          refreshing={refreshing}
        />
        {settingsPanel}
      </>
    );
  }

  if (updateId && !updates.some((update) => update.id === updateId)) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h2 className="text-xl font-semibold">Release note not found</h2>
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
    <div className={`space-y-6 ${editorConflict ? "pb-24" : ""}`}>
      {editorConflict && selected ? (
        <section
          className="flex flex-col gap-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold">The saved version changed</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {editorConflict} Reloading replaces the text currently shown in
              this editor with the latest saved content.
            </p>
          </div>
          <Button
            className="shrink-0"
            variant="destructive"
            disabled={saving}
            onClick={() => void reloadSavedVersion()}
          >
            {saving ? "Reloading…" : "Reload saved version"}
          </Button>
        </section>
      ) : null}
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold text-primary">
            Update shown to your users
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {selected ? "Edit release note" : "Create release note"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep the announcement concise. You can review it privately before
            publishing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected ? (
            <div className="flex min-h-10 items-center rounded-md border bg-background px-3">
              <ProductUpdateVisibilityToggle
                enabled={selected.is_enabled}
                disabled={
                  saving ||
                  Boolean(editorConflict) ||
                  selected.status === "archived"
                }
                onChange={(enabled) =>
                  void setUpdateVisibility(selected, enabled)
                }
              />
            </div>
          ) : null}
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
          {selected && deleteReview ? (
            <div className="flex flex-wrap items-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 p-1" role="alert">
              <span className="px-2 text-xs font-medium text-destructive">Delete this release note permanently?</span>
              <Button
                variant="destructive"
                size="sm"
                disabled={saving || Boolean(editorConflict)}
                onClick={() => void deleteSelectedUpdate()}
              >
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                {saving ? "Deleting…" : "Confirm delete"}
              </Button>
              <Button variant="ghost" size="sm" disabled={saving} onClick={() => setDeleteReview(false)}>
                Cancel
              </Button>
            </div>
          ) : selected ? (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={saving || Boolean(editorConflict)}
              onClick={() => setDeleteReview(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete release note
            </Button>
          ) : null}
        </div>
      </section>

      {selected?.status === "published" ? (
        <section className="flex flex-col gap-3 rounded-lg border border-amber-500/35 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-3xl items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <h3 className="text-sm font-semibold">
                Editing does not re-announce this release note
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                You can correct the live content, but people who already saw this
                release note will not automatically see it again. Create a new
                release note when you want to announce another change.
              </p>
            </div>
          </div>
          <Button
            className="shrink-0"
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}/release-notes/new`)}
          >
            New release note
          </Button>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section ref={editorRef} className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Release note content
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
                  placeholder="What changed?"
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
                  placeholder="Briefly explain what’s new and why it matters."
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
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input
                  ref={imageInputRef}
                  id="update-image"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  disabled={saving || !selected || Boolean(editorConflict)}
                  onChange={(event) => {
                    prepareImage(event.currentTarget.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || !selected || Boolean(editorConflict)}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {selected?.imageUrl ? "Replace image" : "Choose image"}
                </Button>
                <span className="text-xs leading-5 text-muted-foreground">
                  {selected
                    ? "JPEG or PNG. Edit files up to 20 MB; uploads are limited to 2 MB."
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
                  busy={saving || Boolean(editorConflict)}
                  onCancel={() => setPendingImage(null)}
                  onApply={uploadImage}
                  onPreviewChange={setPendingImagePreviewUrl}
                />
              ) : null}
              {selected?.imageUrl && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-end gap-3">
                    {/* Dynamic Supabase URLs are user-owned content and bypass optimization. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.imageUrl}
                      alt={form.imageAltText || "Current release note image"}
                      className="h-auto w-full max-w-md rounded-md border"
                    />
                    {removeImageReview ? (
                      <div className="flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 p-1" role="alert">
                        <span className="px-1 text-xs font-medium text-destructive">Remove image?</span>
                        <Button type="button" size="sm" variant="destructive" disabled={saving || Boolean(editorConflict)} onClick={() => void removeImage()}>
                          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                          Confirm
                        </Button>
                        <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setRemoveImageReview(false)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={saving || Boolean(editorConflict)}
                        onClick={() => setRemoveImageReview(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove image
                      </Button>
                    )}
                  </div>
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
              <Button
                onClick={() => void saveDraft()}
                disabled={saving || Boolean(editorConflict)}
              >
                {saving
                  ? "Saving…"
                  : selected?.status === "published"
                    ? "Save correction"
                    : "Save draft"}
              </Button>
              {selected && (
                <Button
                  variant="outline"
                  onClick={openPrivateTest}
                  disabled={saving || Boolean(editorConflict)}
                >
                  Test
                </Button>
              )}
              {selected?.status === "draft" && (
                <Button
                  variant="outline"
                  onClick={() => reviewPublish(false)}
                  disabled={saving || Boolean(editorConflict)}
                >
                  Publish now
                </Button>
              )}
            </div>
            {selected?.status === "draft" && (
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 rounded-md border border-amber-500/35 bg-amber-500/10 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Publishing creates this release note&apos;s announcement identity.
                    Later edits update the content but do not show it again to people
                    who already saw it. Review the saved draft before publishing.
                  </p>
                </div>
                {publishReview ? (
                  <div
                    className="rounded-md border border-primary/30 bg-primary/5 p-4"
                    role="alert"
                  >
                    <h3 className="text-sm font-semibold">
                      {publishReview === "scheduled"
                        ? "Schedule this release note?"
                        : "Publish this release note now?"}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {publishReview === "scheduled"
                        ? `The saved draft will become eligible on ${new Date(publishAt).toLocaleString()}.`
                        : "The saved draft will become eligible for visitors immediately."}{" "}
                      People who see it will keep that seen state even if you edit or
                      temporarily turn off the release note later.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        disabled={saving || Boolean(editorConflict)}
                        onClick={() =>
                          void publish(publishReview === "scheduled")
                        }
                      >
                        {saving
                          ? "Publishing…"
                          : publishReview === "scheduled"
                            ? "Confirm schedule"
                            : "Confirm publish"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={saving}
                        onClick={() => setPublishReview(null)}
                      >
                        Keep editing
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted/40 p-3">
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
                  disabled={
                    saving || Boolean(editorConflict) || !entitlements?.scheduling
                  }
                  onClick={() => reviewPublish(true)}
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
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {settings?.theme === "auto"
                    ? "Auto theme"
                    : `${settings?.theme || "Auto"} theme`}
                </span>
                {pendingImagePreviewUrl ? (
                  <span
                    className="rounded-sm border border-primary/40 bg-primary/10 px-2 py-1 font-medium text-foreground"
                    role="status"
                  >
                    Previewing unsaved crop
                  </span>
                ) : null}
              </div>
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
              form={
                pendingImagePreviewUrl
                  ? { ...form, imageUrl: pendingImagePreviewUrl }
                  : form
              }
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
      {editorConflict && selected ? (
        <section
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 flex w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 flex-col gap-3 rounded-lg border border-destructive/50 bg-popover p-3 shadow-[var(--shadow-float)] sm:flex-row sm:items-center sm:justify-between md:bottom-6 md:w-[calc(100vw-17rem)]"
          aria-label="Saved version recovery"
        >
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Editing paused for safety</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                Your text is still here. Load the latest saved version before
                uploading, deleting, publishing, or saving again.
              </p>
            </div>
          </div>
          <Button
            className="shrink-0"
            variant="destructive"
            disabled={saving}
            onClick={() => void reloadSavedVersion()}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Reloading…" : "Reload saved version"}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
