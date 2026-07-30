import { createHash } from 'node:crypto'
import sharp from 'sharp'

export const MAX_SCREENSHOT_SIZE = 3 * 1024 * 1024
export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_PIXELS = 25_000_000

export type SafeImageMime = 'image/png' | 'image/jpeg'

export interface ValidatedFeedbackMedia {
  buffer: Buffer
  mimeType: SafeImageMime
  extension: 'png' | 'jpg'
  safeFilename: string
  sha256: string
  size: number
}

function detectedImageMime(buffer: Buffer): SafeImageMime | null {
  if (
    buffer.length >= 8
    && buffer[0] === 0x89
    && buffer.subarray(1, 4).toString('ascii') === 'PNG'
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a
  ) return 'image/png'
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  return null
}

export function normalizeFeedbackFilename(value: string, mimeType: SafeImageMime): string {
  const fallback = mimeType === 'image/png' ? 'attachment.png' : 'attachment.jpg'
  const base = value
    .normalize('NFKC')
    .replace(/[\/\\]/g, '-')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[^A-Za-z0-9._ -]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
  const stem = (base || fallback)
    .replace(/\.[^.]+$/, '')
    .replace(/^[^A-Za-z0-9]+/, '')
    .slice(0, 90) || 'attachment'
  return `${stem}.${mimeType === 'image/png' ? 'png' : 'jpg'}`
}

export async function validateAndSanitizeFeedbackImage({
  buffer,
  claimedMimeType,
  originalFilename,
  maxBytes,
}: {
  buffer: Buffer
  claimedMimeType: string
  originalFilename: string
  maxBytes: number
}): Promise<ValidatedFeedbackMedia> {
  if (buffer.length === 0 || buffer.length > maxBytes) {
    throw new Error(`File must be between 1 byte and ${Math.round(maxBytes / 1024 / 1024)}MB`)
  }

  const detectedMimeType = detectedImageMime(buffer)
  if (!detectedMimeType || detectedMimeType !== claimedMimeType) {
    throw new Error('File contents do not match the declared PNG or JPEG type')
  }

  const image = sharp(buffer, { failOn: 'warning', limitInputPixels: MAX_IMAGE_PIXELS })
  const metadata = await image.metadata()
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
    throw new Error('Image dimensions are invalid or exceed 25 megapixels')
  }

  // Re-encoding removes EXIF, embedded thumbnails, profiles, and trailing payloads.
  const sanitized = detectedMimeType === 'image/png'
    ? await image.rotate().png({ compressionLevel: 9 }).toBuffer()
    : await image.rotate().jpeg({ quality: 88, mozjpeg: true }).toBuffer()

  const safeFilename = normalizeFeedbackFilename(originalFilename, detectedMimeType)
  return {
    buffer: sanitized,
    mimeType: detectedMimeType,
    extension: detectedMimeType === 'image/png' ? 'png' : 'jpg',
    safeFilename,
    sha256: createHash('sha256').update(sanitized).digest('hex'),
    size: sanitized.length,
  }
}
