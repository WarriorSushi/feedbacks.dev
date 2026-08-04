function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

export function shouldProbeAppSession(browserOrigin: string, appOrigin: string) {
  try {
    const browserUrl = new URL(browserOrigin)
    const appUrl = new URL(appOrigin)

    // A local marketing build must never reach into the hosted production app.
    // Besides noisy CORS failures, that would couple local rendering to live state.
    if (isLocalHostname(browserUrl.hostname) && !isLocalHostname(appUrl.hostname)) return false

    return browserUrl.protocol === 'https:' || isLocalHostname(browserUrl.hostname)
  } catch {
    return false
  }
}
