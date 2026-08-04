'use client'

import * as React from 'react'
import Script from 'next/script'
import { useTheme } from 'next-themes'

type CaptchaProvider = 'hcaptcha' | 'turnstile'

type CaptchaApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      theme: 'auto' | 'light' | 'dark'
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
  const { resolvedTheme } = useTheme()
  const captchaTheme = provider === 'turnstile' ? 'auto' : resolvedTheme === 'dark' ? 'dark' : 'light'

  const getApi = React.useCallback(() => window[provider], [provider])

  const renderWidget = React.useCallback(() => {
    const api = getApi()
    if (!api || !hostRef.current || widgetIdRef.current) return

    widgetIdRef.current = api.render(hostRef.current, {
      sitekey: siteKey,
      theme: captchaTheme,
      callback: (token) => onToken(token),
      'expired-callback': () => onToken(null),
      'error-callback': () => onToken(null),
    })
  }, [captchaTheme, getApi, onToken, siteKey])

  React.useEffect(() => {
    const api = getApi()
    if (!api || !widgetIdRef.current) return
    api.remove(widgetIdRef.current)
    widgetIdRef.current = null
    onToken(null)
    renderWidget()
  }, [captchaTheme, getApi, onToken, renderWidget])

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
