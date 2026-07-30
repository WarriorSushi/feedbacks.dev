import type { ProductUpdateContent, ProductUpdatesPublicResponse, WidgetConfig } from '@feedbacks/shared'
import { isProductUpdatePathEligible } from '@feedbacks/shared'
import { createProductUpdateStorage } from './product-update-storage'
import { acquireOverlay, claimUpdatesOwner, hasActiveOverlay, onOverlayAvailable, releaseOverlay, releaseUpdatesOwner } from './overlay-coordinator'

type MetricType = 'impression' | 'dismissal' | 'cta_click'

export class ProductUpdatesController {
  private response: ProductUpdatesPublicResponse | null = null
  private dialog: HTMLElement | null = null
  private currentUpdate: ProductUpdateContent | null = null
  private autoShown = false
  private lastFocus: HTMLElement | null = null
  private priorBodyOverflow = ''
  private autoTimer: number | null = null
  private seenTimer: number | null = null
  private readonly abort = new AbortController()
  private dialogAbort: AbortController | null = null
  private readonly storage
  private readonly ownsUpdates
  private releaseOverlayListener: (() => void) | null = null

  constructor(
    private readonly cfg: WidgetConfig,
    private readonly isFeedbackOpen: () => boolean,
    initialResponse?: ProductUpdatesPublicResponse,
  ) {
    this.storage = createProductUpdateStorage(cfg.projectKey)
    this.ownsUpdates = claimUpdatesOwner(cfg.projectKey, this)
    if (this.ownsUpdates) void this.start(initialResponse)
  }

  private async start(initialResponse?: ProductUpdatesPublicResponse) {
    this.releaseOverlayListener = onOverlayAvailable(() => this.maybeAutoShow())
    document.addEventListener('click', this.onManualTrigger, { signal: this.abort.signal })
    window.addEventListener('popstate', () => this.maybeAutoShow(), { signal: this.abort.signal })
    document.addEventListener('visibilitychange', () => this.maybeAutoShow(), { signal: this.abort.signal })
    window.addEventListener('feedbacks:updates:refresh', () => { void this.refreshUpdates() }, { signal: this.abort.signal })
    if (initialResponse) {
      this.setResponse(initialResponse)
      return
    }
    await this.refreshUpdates()
  }

  async refreshUpdates(): Promise<void> {
    if (!this.cfg.enableUpdates) return
    try {
      const url = new URL(this.cfg.updatesApiUrl || '', location.href)
      url.searchParams.set('projectKey', this.cfg.projectKey)
      const result = await fetch(url, { signal: this.abort.signal })
      if (!result.ok) return
      const response = await result.json() as ProductUpdatesPublicResponse
      if (!response || !Array.isArray(response.updates)) return
      this.setResponse(response)
    } catch {
      this.log('Unable to load updates')
    }
  }

  private setResponse(response: ProductUpdatesPublicResponse) {
    this.response = response
    this.dispatch('feedbacks:updates:ready')
    this.maybeAutoShow()
  }

  async openUpdates(): Promise<boolean> {
    if (!this.ownsUpdates || this.isFeedbackOpen() || hasActiveOverlay()) return false
    const update = this.latestPathEligibleUpdate()
    if (!update) return false
    this.open(update, true)
    return true
  }

  closeUpdates(): void {
    this.close(false)
  }

  getUnreadUpdateCount(): number {
    const seen = this.storage.read().seen
    return (this.response?.updates || []).filter((update) => !seen[update.id]).length
  }

  isOpen(): boolean {
    return Boolean(this.dialog)
  }

  private onManualTrigger = (event: Event) => {
    const trigger = (event.target as Element | null)?.closest?.('[data-feedbacks-updates-trigger]')
    if (!trigger) return
    event.preventDefault()
    void this.openUpdates()
  }

  private latestPathEligibleUpdate() {
    if (!this.response || !isProductUpdatePathEligible(location.pathname, this.response.settings)) return undefined
    return this.response.updates[0]
  }

  private maybeAutoShow() {
    if (
      this.autoShown ||
      this.dialog ||
      this.isFeedbackOpen() ||
      hasActiveOverlay() ||
      document.visibilityState !== 'visible' ||
      !this.response?.settings.autoShow
    ) return

    const seen = this.storage.read().seen
    const update = this.response.updates.find((item) =>
      !seen[item.id] && isProductUpdatePathEligible(location.pathname, this.response!.settings),
    )
    if (!update) return

    if (this.autoTimer) clearTimeout(this.autoTimer)
    this.autoTimer = window.setTimeout(() => {
      if (!this.isFeedbackOpen() && !hasActiveOverlay() && !this.dialog && this.response && isProductUpdatePathEligible(location.pathname, this.response.settings)) {
        this.open(update, false)
      }
    }, this.response.settings.displayDelayMs)
  }

  private open(update: ProductUpdateContent, manual: boolean) {
    if (this.dialog || this.isFeedbackOpen() || hasActiveOverlay()) return
    if (!manual) this.autoShown = true
    this.currentUpdate = update
    this.lastFocus = document.activeElement as HTMLElement | null
    this.priorBodyOverflow = document.body.style.overflow

    const overlay = document.createElement('div')
    overlay.className = 'fb-update-overlay'
    const modal = document.createElement('section')
    modal.className = 'fb-update-modal'
    const configuredTheme = this.response?.settings.theme || 'auto'
    if (configuredTheme === 'dark' || (configuredTheme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)) {
      modal.classList.add('fb-update-theme-dark')
    }
    modal.tabIndex = -1
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    const titleId = `fb-update-title-${update.id}`
    const summaryId = `fb-update-summary-${update.id}`
    modal.setAttribute('aria-labelledby', titleId)
    modal.setAttribute('aria-describedby', summaryId)

    const close = document.createElement('button')
    close.className = 'fb-update-close'
    close.type = 'button'
    close.setAttribute('aria-label', 'Close What’s New')
    close.textContent = '×'
    modal.append(close)

    if (update.imageUrl) {
      const image = document.createElement('img')
      image.className = 'fb-update-image'
      image.src = update.imageUrl
      image.alt = update.imageAltText || ''
      image.loading = 'lazy'
      image.onerror = () => image.remove()
      modal.append(image)
    }

    modal.append(this.text('p', update.versionLabel || 'What’s New', 'fb-update-eyebrow'))
    const title = this.text('h2', update.title, 'fb-update-title')
    title.id = titleId
    modal.append(title)
    const summary = this.text('p', update.summary, 'fb-update-summary')
    summary.id = summaryId
    modal.append(summary)

    if (update.highlights.length) {
      const list = document.createElement('ul')
      list.className = 'fb-update-list'
      update.highlights.forEach((highlight) => list.append(this.text('li', highlight)))
      modal.append(list)
    }

    if (update.ctaLabel && update.ctaUrl) modal.append(this.createCta(update, manual))
    if (this.response?.settings.showPoweredBy) modal.append(this.text('p', 'Powered by feedbacks.dev', 'fb-update-powered'))

    overlay.append(modal)
    this.dialog = overlay
    acquireOverlay(this, 'updates', () => this.close(false))
    document.body.style.overflow = 'hidden'
    document.body.append(overlay)
    this.dialogAbort = new AbortController()
    close.addEventListener('click', () => this.close(true), { signal: this.dialogAbort.signal })
    overlay.addEventListener('click', (event) => { if (event.target === overlay) this.close(true) }, { signal: this.dialogAbort.signal })
    document.addEventListener('keydown', (event) => this.handleKeydown(event, modal), { signal: this.dialogAbort.signal })
    close.focus()

    this.seenTimer = window.setTimeout(() => {
      if (this.dialog && this.currentUpdate?.id === update.id) {
        this.storage.markSeen(update.id)
        this.recordMetric(update.id, 'impression')
      }
    }, 750)
    this.dispatch('feedbacks:updates:shown', update.id, manual)
  }

  private createCta(update: ProductUpdateContent, manual: boolean) {
    const cta = document.createElement('a')
    cta.className = 'fb-update-cta'
    cta.textContent = update.ctaLabel!
    try {
      const url = new URL(update.ctaUrl!, location.href)
      cta.href = url.href
      if (url.origin !== location.origin) {
        cta.target = '_blank'
        cta.rel = 'noopener noreferrer'
      }
    } catch {
      cta.removeAttribute('href')
    }
    cta.addEventListener('click', () => {
      this.storage.markSeen(update.id)
      this.recordMetric(update.id, 'cta_click')
      this.dispatch('feedbacks:updates:cta-clicked', update.id, manual)
    })
    return cta
  }

  private handleKeydown(event: KeyboardEvent, modal: HTMLElement) {
    if (event.key === 'Escape') {
      this.close(true)
      return
    }
    if (event.key !== 'Tab') return
    const focusable = modal.querySelectorAll<HTMLElement>('button,a[href],[tabindex]:not([tabindex="-1"])')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  private close(dismissed: boolean) {
    releaseOverlay(this)
    if (!this.dialog) return
    const update = this.currentUpdate
    if (this.seenTimer) clearTimeout(this.seenTimer)
    this.seenTimer = null
    this.dialogAbort?.abort()
    this.dialogAbort = null
    this.dialog.remove()
    this.dialog = null
    this.currentUpdate = null
    document.body.style.overflow = this.priorBodyOverflow
    this.lastFocus?.focus?.()
    if (dismissed && update) {
      this.storage.markDismissed(update.id)
      this.recordMetric(update.id, 'dismissal')
      this.dispatch('feedbacks:updates:dismissed', update.id)
    }
  }

  private recordMetric(updateId: string, type: MetricType) {
    const url = this.cfg.updatesEventsApiUrl
    if (!url) return
    const body = JSON.stringify({ projectKey: this.cfg.projectKey, events: [{ updateId, type }] })
    try {
      void fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
    } catch {
      this.log('Unable to record update metric')
    }
  }

  private dispatch(name: string, updateId?: string, manual?: boolean) {
    window.dispatchEvent(new CustomEvent(name, { detail: {
      projectKeySuffix: this.cfg.projectKey.slice(-4),
      ...(updateId ? { updateId } : {}),
      ...(manual === undefined ? {} : { manual }),
    } }))
  }

  private text(tag: string, value: string, className?: string) {
    const element = document.createElement(tag)
    if (className) element.className = className
    element.textContent = value
    return element
  }

  private log(message: string) {
    if (this.cfg.debug) console.debug(`[Feedbacks updates] ${message}`)
  }

  destroy() {
    if (this.autoTimer) clearTimeout(this.autoTimer)
    this.abort.abort()
    this.releaseOverlayListener?.()
    this.releaseOverlayListener = null
    this.closeUpdates()
    if (this.ownsUpdates) releaseUpdatesOwner(this.cfg.projectKey, this)
  }
}
