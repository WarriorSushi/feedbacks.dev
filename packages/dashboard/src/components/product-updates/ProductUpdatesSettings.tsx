"use client";

import * as React from "react";
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
  onBack,
}: {
  settings: ProductUpdateSettings;
  entitlements: ProductUpdateEntitlements | null;
  onSave: (settings: ProductUpdateSettings) => Promise<void>;
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
          onChange={(showPoweredBy) => setDraft({ ...draft, showPoweredBy })}
        />
        <Button onClick={() => void onSave(draft)}>Save settings</Button>
      </div>
    </div>
  );
}
