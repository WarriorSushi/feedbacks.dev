import { PRODUCT_UPDATE_LIMITS, type ProductUpdateContent, type ProductUpdatePublicSettings } from '@feedbacks/shared'

export const PRODUCT_UPDATE_DEFAULT_SETTINGS: ProductUpdatePublicSettings = {
  autoShow: true,
  displayDelayMs: 1500,
  theme: 'auto',
  accentColor: '#6366f1',
  includePaths: [],
  excludePaths: [],
  showPoweredBy: true,
}

export function mapProductUpdate(row: Record<string, unknown>, imageUrl?: string): ProductUpdateContent {
  return {
    id: String(row.id),
    ...(typeof row.version_label === 'string' ? { versionLabel: row.version_label } : {}),
    title: String(row.title), summary: String(row.summary),
    highlights: Array.isArray(row.highlights) ? row.highlights.filter((value): value is string => typeof value === 'string') : [],
    ...(imageUrl ? { imageUrl } : {}),
    ...(typeof row.image_alt_text === 'string' && row.image_alt_text ? { imageAltText: row.image_alt_text } : {}),
    ...(typeof row.cta_label === 'string' ? { ctaLabel: row.cta_label } : {}),
    ...(typeof row.cta_url === 'string' ? { ctaUrl: row.cta_url } : {}),
    publishedAt: String(row.published_at),
    ...(typeof row.expires_at === 'string' ? { expiresAt: row.expires_at } : {}),
  }
}

export function mapProductUpdateSettings(row?: Record<string, unknown> | null): ProductUpdatePublicSettings {
  if (!row) return PRODUCT_UPDATE_DEFAULT_SETTINGS
  return {
    autoShow: row.auto_show !== false,
    displayDelayMs: typeof row.display_delay_ms === 'number' ? row.display_delay_ms : 1500,
    theme: row.theme === 'light' || row.theme === 'dark' ? row.theme : 'auto',
    accentColor: typeof row.accent_color === 'string' ? row.accent_color : PRODUCT_UPDATE_DEFAULT_SETTINGS.accentColor,
    includePaths: Array.isArray(row.include_paths) ? row.include_paths.filter((value): value is string => typeof value === 'string') : [],
    excludePaths: Array.isArray(row.exclude_paths) ? row.exclude_paths.filter((value): value is string => typeof value === 'string') : [],
    showPoweredBy: row.show_powered_by !== false,
  }
}

export function isValidProductUpdateImage(file: File): boolean {
  return file.size <= 2 * 1024 * 1024 && ['image/jpeg', 'image/png'].includes(file.type)
}

export function publicImageUrl(admin: { storage: { from(bucket: string): { getPublicUrl(path: string): { data: { publicUrl: string } } } } }, imagePath: unknown): string | undefined {
  if (typeof imagePath !== 'string' || !imagePath) return undefined
  return admin.storage.from('product_update_images').getPublicUrl(imagePath).data.publicUrl
}

export function isProductUpdateResponseBounded(payload: unknown): boolean {
  return new TextEncoder().encode(JSON.stringify(payload)).byteLength < 50 * 1024
}

export { PRODUCT_UPDATE_LIMITS }
