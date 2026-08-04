'use client'

import { useEffect } from 'react'
import { shouldProbeAppSession } from '@/lib/auth-redirect'

export function AuthenticatedRedirect({ appOrigin }: { appOrigin: string }) {
  useEffect(() => {
    if (!shouldProbeAppSession(window.location.origin, appOrigin)) return

    const controller = new AbortController()

    void fetch(`${appOrigin}/api/auth-status`, {
      cache: 'no-store',
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((result: { user?: unknown } | null) => {
        if (result?.user) window.location.replace(`${appOrigin}/dashboard`)
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [appOrigin])

  return null
}
