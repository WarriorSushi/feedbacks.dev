"use client";

import {
  Archive,
  Pencil,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/workspace-shell";
import {
  productUpdateStateLabel,
  type ProductUpdate,
} from "./product-update-model";

export function ProductUpdatesOverview({
  updates,
  onNew,
  onEdit,
  onSettings,
  onAction,
  busy,
}: {
  updates: ProductUpdate[];
  onNew: () => void;
  onEdit: (id: string) => void;
  onSettings: () => void;
  onAction: (
    update: ProductUpdate,
    action: "archive" | "restore" | "delete",
  ) => Promise<void>;
  busy: boolean;
}) {
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
                {productUpdateStateLabel(update)} ·{" "}
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
