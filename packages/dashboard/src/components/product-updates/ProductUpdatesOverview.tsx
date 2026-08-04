"use client";

import * as React from "react";
import {
  Archive,
  Pencil,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/workspace-shell";
import {
  productUpdateStateLabel,
  type ProductUpdate,
} from "./product-update-model";
import { ProductUpdateVisibilityToggle } from "./ProductUpdateVisibilityToggle";

export function ProductUpdatesOverview({
  updates,
  onNew,
  onEdit,
  onSettings,
  onAction,
  onVisibilityChange,
  pendingActions,
  refreshing,
}: {
  updates: ProductUpdate[];
  onNew: () => void;
  onEdit: (id: string) => void;
  onSettings: () => void;
  onAction: (
    update: ProductUpdate,
    action: "archive" | "restore" | "delete",
  ) => Promise<void>;
  onVisibilityChange: (update: ProductUpdate, enabled: boolean) => Promise<void>;
  pendingActions: Record<string, "archive" | "restore" | "delete" | "visibility">;
  refreshing: boolean;
}) {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  if (!updates.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex justify-end">
          <Button variant="outline" onClick={onSettings}>
            <Settings2 className="mr-2 h-4 w-4" />
            Display settings
          </Button>
        </div>
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
            Create the first release note
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with a title and summary. Add an image or delivery rules only
            if they help.
          </p>
          <Button className="mt-5" onClick={onNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create first release note
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
        meta={refreshing ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Syncing latest changes
          </span>
        ) : null}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={onSettings}>
              <Settings2 className="mr-2 h-4 w-4" />
              Display settings
            </Button>
            <Button onClick={onNew}>
              <Plus className="mr-2 h-4 w-4" />
              New release note
            </Button>
          </div>
        }
      />
      <div className="divide-y overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
        {updates.map((update) => {
          const pending = pendingActions[update.id] || null;
          const rowBusy = Boolean(pending);
          return (
          <div
            key={update.id}
            aria-busy={rowBusy}
            data-pending-action={pending || undefined}
            className="flex min-h-20 items-center gap-2 p-2 transition-[opacity,transform,background-color] duration-200 [transition-timing-function:var(--ease-out-quint)] data-[pending-action=delete]:scale-[0.995] data-[pending-action=delete]:bg-muted/25 data-[pending-action=delete]:opacity-55 sm:p-3"
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
                {productUpdateStateLabel(update)} ·{" "}
                {update.published_at
                  ? new Date(update.published_at).toLocaleDateString()
                  : "Not published"}{" "}
                · {update.metrics.impressions} views ·{" "}
                {update.metrics.ctaClicks} CTA clicks ·{" "}
                {update.metrics.dismissals} dismissals
              </span>
            </button>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              {confirmDeleteId === update.id ? (
                <div className="flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 p-1" role="alert">
                  <span className="px-1 text-xs font-medium text-destructive">Delete?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={rowBusy}
                    onClick={async () => {
                      await onAction(update, "delete");
                      setConfirmDeleteId(null);
                    }}
                  >
                    {pending === "delete" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" disabled={rowBusy} onClick={() => setConfirmDeleteId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
              <ProductUpdateVisibilityToggle
                compact
                enabled={update.is_enabled}
                pending={pending === "visibility"}
                disabled={rowBusy || update.status === "archived"}
                onChange={(enabled) => void onVisibilityChange(update, enabled)}
              />
              {update.status === "archived" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={rowBusy}
                  aria-label={`Restore ${update.title}`}
                  onClick={() => void onAction(update, "restore")}
                >
                  {pending === "restore" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={rowBusy}
                  aria-label={`Archive ${update.title}`}
                  onClick={() => void onAction(update, "archive")}
                >
                  {pending === "archive" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={rowBusy}
                aria-label={`Delete ${update.title}`}
                onClick={() => setConfirmDeleteId(update.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
                </>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
