'use client'

import * as React from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShieldCheck, X } from 'lucide-react'
import { MARKETING_CONSENT_COOKIE, MARKETING_CONSENT_VERSION } from '@/lib/marketing-public'

type ConsentChoice = 'unknown' | 'granted' | 'denied'
type ConversionDetail = { eventName: 'Lead' | 'CompleteRegistration' | 'ProjectCreated'; eventId: string; email?: string }

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string }
    _fbq?: Window['fbq']
    rdt?: ((...args: unknown[]) => void) & { callQueue?: unknown[][] }
  }
}

function cookieDomain() {
  return window.location.hostname === 'feedbacks.dev' || window.location.hostname.endsWith('.feedbacks.dev')
    ? '; Domain=.feedbacks.dev'
    : ''
}

function setConsentCookie(choice: Exclude<ConsentChoice, 'unknown'>) {
  document.cookie = `${MARKETING_CONSENT_COOKIE}=${MARKETING_CONSENT_VERSION}.${choice}; Path=/; Max-Age=15552000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}${cookieDomain()}`
}

function getConsentCookie(): ConsentChoice {
  const value = document.cookie.split('; ').find((part) => part.startsWith(`${MARKETING_CONSENT_COOKIE}=`))?.split('=')[1]
  if (value === `${MARKETING_CONSENT_VERSION}.granted`) return 'granted'
  if (value === `${MARKETING_CONSENT_VERSION}.denied`) return 'denied'
  return 'unknown'
}

function loadScript(src: string, id: string) {
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

function initProviders(config: MarketingMeasurementProps['config']) {
  if (config.googleTagId) {
    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer?.push(args) }
    window.gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
    })
    window.gtag('consent', 'update', {
      ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted',
    })
    window.gtag('config', config.googleTagId, { send_page_view: false })
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.googleTagId)}`, 'feedbacks-google-tag')
  }

  if (config.metaPixelId && !window.fbq) {
    const fbq = function (...args: unknown[]) { fbq.queue?.push(args) } as NonNullable<Window['fbq']>
    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    window.fbq = fbq
    window._fbq = fbq
    fbq('init', config.metaPixelId)
    loadScript('https://connect.facebook.net/en_US/fbevents.js', 'feedbacks-meta-pixel')
  }

  if (config.redditPixelId && !window.rdt) {
    const rdt = function (...args: unknown[]) { rdt.callQueue?.push(args) } as NonNullable<Window['rdt']>
    rdt.callQueue = []
    window.rdt = rdt
    rdt('init', config.redditPixelId)
    loadScript('https://www.redditstatic.com/ads/pixel.js', 'feedbacks-reddit-pixel')
  }
}

function trackPageView() {
  window.gtag?.('event', 'page_view', { page_location: window.location.href })
  window.fbq?.('track', 'PageView')
  window.rdt?.('track', 'PageVisit')
}

function trackConversion(detail: ConversionDetail, config: MarketingMeasurementProps['config']) {
  const storageKey = `feedbacks:conversion:${detail.eventId}`
  if (window.sessionStorage.getItem(storageKey)) return
  window.sessionStorage.setItem(storageKey, '1')

  if (detail.email) window.gtag?.('set', 'user_data', { email: detail.email.trim().toLowerCase() })
  const googleLabel = detail.eventName === 'Lead' ? config.googleLeadLabel : config.googleSignupLabel
  if (config.googleTagId && googleLabel) {
    window.gtag?.('event', 'conversion', {
      send_to: `${config.googleTagId}/${googleLabel}`,
      transaction_id: detail.eventId,
    })
  }
  if (detail.eventName === 'Lead') window.fbq?.('track', 'Lead', {}, { eventID: detail.eventId })
  if (detail.eventName === 'CompleteRegistration') window.fbq?.('track', 'CompleteRegistration', {}, { eventID: detail.eventId })
  if (detail.eventName === 'ProjectCreated') window.fbq?.('trackCustom', 'ProjectCreated', {}, { eventID: detail.eventId })

  const redditEvent = detail.eventName === 'CompleteRegistration' ? 'SignUp' : detail.eventName
  window.rdt?.('track', redditEvent, { conversionId: detail.eventId })
}

function captureAttribution() {
  const allowed = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'rdt_cid']
  const params = new URLSearchParams(window.location.search)
  const attribution = Object.fromEntries(allowed.flatMap((key) => {
    const value = params.get(key)?.slice(0, 240)
    return value ? [[key, value]] : []
  }))
  if (!Object.keys(attribution).length) return
  void fetch('/api/marketing/attribution', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(attribution),
  })
}

type MarketingMeasurementProps = {
  showBanner: boolean
  config: {
    googleTagId?: string
    googleLeadLabel?: string
    googleSignupLabel?: string
    metaPixelId?: string
    redditPixelId?: string
  }
}

export function MarketingMeasurement({ showBanner, config }: MarketingMeasurementProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [choice, setChoice] = React.useState<ConsentChoice>('unknown')
  const [preferencesOpen, setPreferencesOpen] = React.useState(false)
  const hasProvider = Boolean(config.googleTagId || config.metaPixelId || config.redditPixelId)

  React.useEffect(() => setChoice(getConsentCookie()), [])

  React.useEffect(() => {
    const open = () => setPreferencesOpen(true)
    window.addEventListener('feedbacks:open-privacy-choices', open)
    return () => window.removeEventListener('feedbacks:open-privacy-choices', open)
  }, [])

  React.useEffect(() => {
    const listener = (event: Event) => {
      if (choice !== 'granted') return
      initProviders(config)
      trackConversion((event as CustomEvent<ConversionDetail>).detail, config)
    }
    window.addEventListener('feedbacks:marketing-conversion', listener)
    return () => window.removeEventListener('feedbacks:marketing-conversion', listener)
  }, [choice, config])

  React.useEffect(() => {
    if (choice !== 'granted' || !hasProvider) return
    const eventId = searchParams.get('conversion_event')
    const eventName = searchParams.get('conversion')
    if (!showBanner && !(eventId && eventName === 'signup')) return
    initProviders(config)
    captureAttribution()
    if (showBanner) trackPageView()

    if (eventId && eventName === 'signup') {
      trackConversion({ eventId, eventName: 'CompleteRegistration' }, config)
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('conversion')
      cleanUrl.searchParams.delete('conversion_event')
      window.history.replaceState({}, '', cleanUrl)
    }
  }, [choice, config, hasProvider, pathname, searchParams, showBanner])

  const choose = (next: Exclude<ConsentChoice, 'unknown'>) => {
    setConsentCookie(next)
    setChoice(next)
    setPreferencesOpen(false)
  }

  if (!hasProvider || (!showBanner && !preferencesOpen)) return null
  if (choice !== 'unknown' && !preferencesOpen) return null

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-xl border bg-background/95 p-4 shadow-[var(--shadow-float)] backdrop-blur sm:p-5" role="dialog" aria-label="Advertising measurement choices">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold">Your privacy choice</p>
            {preferencesOpen && choice !== 'unknown' && (
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setPreferencesOpen(false)} aria-label="Close privacy choices"><X className="h-4 w-4" /></button>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">With permission, we use Google, Meta, and Reddit measurement to understand which ads lead to signups. Nothing is loaded in customer widgets, and you can change this choice later.</p>
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => choose('denied')}>Only necessary</Button>
            <Button size="sm" onClick={() => choose('granted')}>Allow measurement</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
