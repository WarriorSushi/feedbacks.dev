"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ProductUpdateCheck,
  ProductUpdateField,
} from "./ProductUpdatePresentation";
import type {
  ProductUpdateEntitlements,
  ProductUpdateSettings,
} from "./product-update-model";

export function ProductUpdatesSettings({
  settings,
  entitlements,
  onSave,
  onClose,
}: {
  settings: ProductUpdateSettings;
  entitlements: ProductUpdateEntitlements | null;
  onSave: (settings: ProductUpdateSettings) => Promise<boolean>;
  onClose: () => void;
}) {
  const [draft, setDraft] = React.useState(settings);
  const [submitting, setSubmitting] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const previousFocus = React.useRef<HTMLElement | null>(null);
  const delaySeconds = draft.displayDelayMs / 1000;
  const hasCustomDelay = ![0, 3, 5].includes(delaySeconds);

  React.useEffect(() => {
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!submitting) onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])',
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

  async function save() {
    setSubmitting(true);
    const saved = await onSave(draft);
    setSubmitting(false);
    if (saved) onClose();
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-foreground/35 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-update-settings-title"
      onKeyDown={handleKeyDown}
      onMouseDown={(event) => {
        if (!submitting && event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="ml-auto flex h-full w-full max-w-xl animate-drawer-in flex-col border-l bg-background shadow-[var(--shadow-float)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b bg-surface-raised px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold text-primary">
              Updates for your users
            </p>
            <h2
              id="product-update-settings-title"
              className="mt-1 text-xl font-semibold tracking-[-0.025em]"
            >
              Display settings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Control how “What’s new” appears inside your product.
            </p>
          </div>
          <Button
            ref={closeRef}
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Close display settings"
            disabled={submitting}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <ProductUpdateCheck
            label="Show product updates to users"
            value={draft.enabled}
            onChange={(enabled) => setDraft({ ...draft, enabled })}
          />
          <ProductUpdateCheck
            label="Auto-show the newest unseen update"
            value={draft.autoShow}
            onChange={(autoShow) => setDraft({ ...draft, autoShow })}
          />
          <ProductUpdateField label="Appearance">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={draft.theme}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  theme: event.target.value as ProductUpdateSettings["theme"],
                })
              }
            >
              <option value="auto">Match visitor device</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </ProductUpdateField>
          <ProductUpdateField label="Show after">
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
          </ProductUpdateField>
          <ProductUpdateField label="Accent color">
            <Input
              value={draft.accentColor}
              onChange={(event) =>
                setDraft({ ...draft, accentColor: event.target.value })
              }
            />
          </ProductUpdateField>
          <details className="rounded-md border p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Page targeting
            </summary>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Use pathname prefixes such as /dashboard or /settings. Leave both
              lists empty to show updates everywhere.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ProductUpdateField label="Show on specific pages">
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
              </ProductUpdateField>
              <ProductUpdateField label="Hide on specific pages">
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
              </ProductUpdateField>
            </div>
          </details>
          <ProductUpdateCheck
            label="Show feedbacks.dev branding"
            value={draft.showPoweredBy}
            disabled={!entitlements?.customBranding}
            onChange={(showPoweredBy) =>
              setDraft({ ...draft, showPoweredBy })
            }
          />
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t bg-surface-raised px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void save()}>
            {submitting ? "Saving…" : "Save settings"}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
