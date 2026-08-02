'use client'

import * as React from 'react'
import Script from 'next/script'

type CaptchaProvider = 'hcaptcha' | 'turnstile'

type CaptchaApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      theme: 'auto'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    hcaptcha?: CaptchaApi
    turnstile?: CaptchaApi
  }
}

const providerScripts: Record<CaptchaProvider, string> = {
  hcaptcha: 'https://js.hcaptcha.com/1/api.js?render=explicit',
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
}

export function AuthCaptcha({
  provider,
  siteKey,
  resetKey,
  onToken,
}: {
  provider: CaptchaProvider
  siteKey: string
  resetKey: number
  onToken: (token: string | null) => void
}) {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const widgetIdRef = React.useRef<string | null>(null)

  const getApi = React.useCallback(() => window[provider], [provider])

  const renderWidget = React.useCallback(() => {
    const api = getApi()
    if (!api || !hostRef.current || widgetIdRef.current) return

    widgetIdRef.current = api.render(hostRef.current, {
      sitekey: siteKey,
      theme: 'auto',
      callback: (token) => onToken(token),
      'expired-callback': () => onToken(null),
      'error-callback': () => onToken(null),
    })
  }, [getApi, onToken, siteKey])

  React.useEffect(() => {
    return () => {
      const api = getApi()
      if (api && widgetIdRef.current) api.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [getApi])

  React.useEffect(() => {
    const api = getApi()
    if (api && widgetIdRef.current) {
      api.reset(widgetIdRef.current)
      onToken(null)
    }
  }, [getApi, onToken, resetKey])

  return (
    <>
      <Script src={providerScripts[provider]} strategy="afterInteractive" onReady={renderWidget} />
      <div ref={hostRef} className="flex min-h-[78px] justify-center" />
    </>
  )
}
