"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ProductUpdateForm,
  ProductUpdateSettings,
} from "./product-update-model";

export function ProductUpdateField({
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

export function ProductUpdateCheck({
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

export function ProductUpdateMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold">{value}</dd>
    </div>
  );
}

export function ProductUpdatePreview({
  form,
  dark,
  mobile,
  accent,
}: {
  form: ProductUpdateForm;
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

export function ProductUpdatePrivateTestDialog({
  form,
  settings,
  onClose,
}: {
  form: ProductUpdateForm;
  settings: ProductUpdateSettings;
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
        <ProductUpdatePreview
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
