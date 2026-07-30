/**
 * Keep automatic page context useful for routing while excluding query values
 * and fragments, which commonly contain tokens, search terms, or customer data.
 */
export function sanitizeFeedbackPageUrl(value: string): string {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return `${url.origin}${url.pathname}`
  } catch {
    return ''
  }
}
