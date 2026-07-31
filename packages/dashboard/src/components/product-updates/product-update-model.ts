export type ProductUpdate = {
  id: string;
  updated_at: string;
  status: "draft" | "published" | "archived";
  version_label: string | null;
  title: string;
  summary: string;
  highlights: string[];
  cta_label: string | null;
  cta_url: string | null;
  ctas?: Array<{ label: string; url: string }>;
  imageUrl?: string;
  image_alt_text: string | null;
  published_at: string | null;
  expires_at: string | null;
  metrics: { impressions: number; dismissals: number; ctaClicks: number };
};

export type ProductUpdateSettings = {
  enabled: boolean;
  autoShow: boolean;
  displayDelayMs: number;
  theme: "auto" | "light" | "dark";
  accentColor: string;
  includePaths: string[];
  excludePaths: string[];
  showPoweredBy: boolean;
};

export type ProductUpdateEntitlements = {
  scheduling: boolean;
  analyticsDays: number;
  activeLimit: number | null;
  customBranding: boolean;
};

export type ProductUpdateForm = {
  versionLabel: string;
  title: string;
  summary: string;
  highlights: string;
  ctas: Array<{ label: string; url: string }>;
  expiresAt: string;
  imageAltText: string;
  imageUrl: string;
};

export type ProductModules = { feedback: boolean; updates: boolean };

export type ProductEmbedStatus = {
  state: "not_detected" | "connected" | "stale";
  lastSeenAt: string | null;
};

export const blankProductUpdateForm: ProductUpdateForm = {
  versionLabel: "",
  title: "",
  summary: "",
  highlights: "",
  ctas: [],
  expiresAt: "",
  imageAltText: "",
  imageUrl: "",
};

export function toProductUpdateForm(update: ProductUpdate): ProductUpdateForm {
  return {
    versionLabel: update.version_label || "",
    title: update.title,
    summary: update.summary,
    highlights: update.highlights.join("\n"),
    ctas:
      update.ctas?.length
        ? update.ctas
        : update.cta_label && update.cta_url
          ? [{ label: update.cta_label, url: update.cta_url }]
          : [],
    expiresAt: localDateTime(update.expires_at),
    imageAltText: update.image_alt_text || "",
    imageUrl: update.imageUrl || "",
  };
}

export function localDateTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function productUpdateStateLabel(update: ProductUpdate) {
  if (update.status === "archived") return "Archived";
  if (update.status === "draft") return "Draft";
  if (update.expires_at && new Date(update.expires_at) <= new Date())
    return "Expired";
  if (update.published_at && new Date(update.published_at) > new Date())
    return "Scheduled";
  return "Live";
}
