import styles from './styles.css';
import type { WidgetConfig, FeedbackData, FeedbackResponse, CategoryType } from './types';
import { sanitizeFeedbackPageUrl } from './privacy';
import {
  isWidgetBootstrapResponse,
  readCachedFeedbackEnabled,
  readCachedRemoteWidgetConfig,
  writeCachedFeedbackEnabled,
  writeCachedRemoteWidgetConfig,
  type WidgetBootstrapResponse,
} from '@feedbacks/shared';
import { ProductUpdatesController } from './product-updates';
import { acquireOverlay, releaseOverlay } from './overlay-coordinator';

// ---- Helpers ----

function parseHexRGB(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3,6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function luminance(r: number, g: number, b: number): number {
  const f = (c: number) => { const v = c/255; return v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; };
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
}

function darkenHex(hex: string, amount = 20): string {
  const rgb = parseHexRGB(hex);
  if (!rgb) return hex;
  const clamp = (v: number) => Math.max(0, Math.min(255, v - amount));
  return `#${[clamp(rgb[0]),clamp(rgb[1]),clamp(rgb[2])].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
}

function isLightColor(hex: string): boolean {
  const rgb = parseHexRGB(hex);
  if (!rgb) return false;
  return luminance(rgb[0], rgb[1], rgb[2]) > 0.45;
}

function escapeHtml(str: string): string {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

const STAR_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

const CHAT_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;

const CHECK_SVG = `<svg viewBox="0 0 24 24"><polyline points="6 12 10 16 18 8"/></svg>`;

const CATEGORY_META: Record<CategoryType, { icon: string; label: string }> = {
  bug:      { icon: '\u{1F41B}', label: 'Bug' },
  idea:     { icon: '\u{1F4A1}', label: 'Idea' },
  praise:   { icon: '\u{1F389}', label: 'Praise' },
  question: { icon: '\u{2753}', label: 'Question' },
};

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

// ---- Widget Class ----

class FeedbacksWidget {
  private cfg: Required<Pick<WidgetConfig, 'projectKey'>> & WidgetConfig;
  private isOpen = false;
  private launcher: HTMLElement | null = null;
  private overlayEl: HTMLElement | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private lastFocus: HTMLElement | null = null;
  private screenshotData: string | null = null;
  private selectedCategory: CategoryType | '' = '';
  private selectedRating = 0;
  private hoverRating = 0;
  private maxRetries = 3;
  private boundKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private themeVars: Record<string, string> = {};
  private updatesController: ProductUpdatesController | null = null;
  private feedbackEnabled = false;
  private inlineContainer: HTMLElement | null = null;
  private managedHost: HTMLElement | null = null;
  private generatedTrigger: HTMLButtonElement | null = null;
  private bootstrapController: AbortController | null = null;
  private autoOpenTimer: number | null = null;
  private destroyed = false;

  constructor(config: WidgetConfig) {
    this.cfg = { position: 'bottom-right', embedMode: 'modal', ...config };
    this.boot();
  }

  static init(config: WidgetConfig): FeedbacksWidget {
    return new FeedbacksWidget(config);
  }

  private boot(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  private setup(): void {
    if (this.destroyed) return;
    this.injectStyles();
    void this.initializeModules();
  }

  private async initializeModules(): Promise<void> {
    const bootstrap = await this.loadBootstrap();
    if (this.destroyed) return;
    const storage = this.getLocalStorage();
    let cachedFeedbackEnabled: boolean | undefined;

    if (bootstrap) {
      this.cfg = { ...this.cfg, ...bootstrap.feedbackConfig, projectKey: this.cfg.projectKey };
      writeCachedRemoteWidgetConfig(storage, this.cfg.projectKey, bootstrap.feedbackConfig);
      writeCachedFeedbackEnabled(storage, this.cfg.projectKey, bootstrap.modules.feedback);
    } else {
      const cachedConfig = readCachedRemoteWidgetConfig(storage, this.cfg.projectKey);
      cachedFeedbackEnabled = readCachedFeedbackEnabled(storage, this.cfg.projectKey);
      if (cachedConfig) {
        this.cfg = { ...this.cfg, ...cachedConfig, projectKey: this.cfg.projectKey };
        this.log('Using the last verified remote configuration');
      }
    }
    this.applyTheme();

    this.feedbackEnabled = bootstrap?.modules.feedback ?? cachedFeedbackEnabled ?? this.cfg.feedbackEnabled ?? true;
    if (this.feedbackEnabled) this.setupFeedbackPresentation();

    if (bootstrap?.modules.updates) {
      this.updatesController = new ProductUpdatesController(this.cfg, () => this.isOpen, bootstrap.updates);
    } else if (!bootstrap && this.cfg.enableUpdates) {
      // Compatibility for legacy embeds while the bootstrap endpoint is
      // unavailable. A successful bootstrap remains authoritative.
      this.updatesController = new ProductUpdatesController(this.cfg, () => this.isOpen);
    }

    this.log('Widget initialized');
  }

  private setupFeedbackPresentation(): void {
    if (this.cfg.embedMode === 'inline') {
      this.renderInline();
    } else if (this.cfg.embedMode === 'trigger') {
      this.attachTriggers();
    } else {
      this.renderLauncher();
    }

    // Keyboard shortcut
    if (this.cfg.openOnKey) {
      const parts = this.cfg.openOnKey.toLowerCase().split('+');
      const key = parts.pop()!;
      this.boundKeydownHandler = (e) => {
        const modOk = (!parts.includes('shift') || e.shiftKey) &&
                      (!parts.includes('ctrl') || e.ctrlKey) &&
                      (!parts.includes('alt') || e.altKey);
        if (modOk && e.key.toLowerCase() === key) {
          e.preventDefault();
          this.isOpen ? this.close() : this.open();
        }
      };
      document.addEventListener('keydown', this.boundKeydownHandler);
    }

    // Auto-open
    if (this.cfg.openAfterMs && this.cfg.openAfterMs > 0) {
      this.autoOpenTimer = window.setTimeout(() => {
        this.autoOpenTimer = null;
        if (!this.isOpen && !this.destroyed) this.open();
      }, this.cfg.openAfterMs);
    }
  }

  /**
   * The bootstrap is additive: failure deliberately leaves the historical
   * feedback behaviour in place. This is the safety property that permits a
   * gradual migration away from the legacy updates endpoint.
   */
  private async loadBootstrap(): Promise<WidgetBootstrapResponse | null> {
    const endpoint = this.bootstrapUrl();
    const controller = new AbortController();
    this.bootstrapController = controller;
    const timeout = window.setTimeout(() => controller.abort(), 4_000);
    try {
      const response = await fetch(endpoint, { signal: controller.signal });
      if (!response.ok) throw new Error(`Bootstrap request failed: ${response.status}`);
      const payload: unknown = await response.json();
      if (!isWidgetBootstrapResponse(payload)) throw new Error('Invalid bootstrap response');
      return payload;
    } catch {
      this.log('Bootstrap unavailable; retaining compatibility mode');
      return null;
    } finally {
      clearTimeout(timeout);
      if (this.bootstrapController === controller) this.bootstrapController = null;
    }
  }

  private bootstrapUrl(): string {
    const feedbackUrl = this.cfg.apiUrl || 'https://app.feedbacks.dev/api/feedback';
    const url = new URL('/api/widget/bootstrap', feedbackUrl);
    url.searchParams.set('projectKey', this.cfg.projectKey);
    url.searchParams.set('runtimeVersion', '2.0.0');
    return url.toString();
  }

  private getLocalStorage(): Storage | null {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  private getSessionStorage(): Storage | null {
    try {
      return window.sessionStorage;
    } catch {
      return null;
    }
  }

  private findManagedHost(): HTMLElement | null {
    if (this.managedHost?.isConnected) return this.managedHost;
    const host = Array.from(document.querySelectorAll<HTMLElement>('[data-feedbacks-host]'))
      .find((element) => element.dataset.feedbacksHost === this.cfg.projectKey) || null;
    this.managedHost = host;
    return host;
  }

  // ---- Styles & Theme ----

  private injectStyles(): void {
    if (document.getElementById('fb-widget-styles')) return;
    this.styleEl = document.createElement('style');
    this.styleEl.id = 'fb-widget-styles';
    this.styleEl.textContent = styles;
    document.head.appendChild(this.styleEl);
  }

  private applyTheme(): void {
    // We'll apply CSS vars to the widget containers, not :root
    // Store values and apply them when containers are created
    this.themeVars = {};

    // Inherit host font
    try {
      const hostFont = getComputedStyle(document.body).fontFamily;
      if (hostFont) this.themeVars['--fb-font'] = hostFont;
    } catch { /* ignore */ }

    const color = this.cfg.primaryColor || '#6366f1';
    this.themeVars['--fb-primary'] = color;
    this.themeVars['--fb-primary-hover'] = darkenHex(color);
    const rgb = parseHexRGB(color);
    if (rgb) this.themeVars['--fb-primary-rgb'] = rgb.join(', ');

    if (this.cfg.backgroundColor) {
      this.themeVars['--fb-bg'] = this.cfg.backgroundColor;
      if (!isLightColor(this.cfg.backgroundColor)) {
        this.themeVars['--fb-text'] = '#f8fafc';
        this.themeVars['--fb-text-muted'] = 'rgba(248,250,252,0.7)';
        this.themeVars['--fb-border'] = 'rgba(255,255,255,0.15)';
        this.themeVars['--fb-bg-secondary'] = 'rgba(255,255,255,0.06)';
      }
    }

    if (this.cfg.modalWidth) {
      this.themeVars['--fb-modal-width'] = this.cfg.modalWidth + 'px';
    }
  }

  private applyThemeToElement(el: HTMLElement): void {
    for (const [key, value] of Object.entries(this.themeVars)) {
      el.style.setProperty(key, value);
    }
  }

  // ---- Launcher ----

  private renderLauncher(): void {
    this.launcher = document.createElement('button');
    const pos = this.cfg.position || 'bottom-right';
    this.launcher.className = `fb-launcher fb-pos-${pos}`;
    const label = this.cfg.buttonText ?? 'Feedback';
    this.launcher.innerHTML = `${CHAT_SVG}<span>${escapeHtml(label)}</span>`;
    this.launcher.setAttribute('aria-label', label);
    if (this.cfg.primaryColor) {
      this.launcher.style.color = isLightColor(this.cfg.primaryColor) ? '#111827' : '#ffffff';
    }
    this.launcher.addEventListener('click', () => this.open());
    this.applyThemeToElement(this.launcher);
    document.body.appendChild(this.launcher);
  }

  // ---- Trigger Mode ----

  private attachTriggers(): void {
    const sel = this.cfg.target || '[data-feedbacks-trigger]';
    let els: Element[] = [];
    try {
      els = Array.from(document.querySelectorAll(sel));
    } catch {
      this.log('Invalid trigger selector');
    }
    if (els.length === 0) {
      const host = this.findManagedHost();
      if (host) {
        host.innerHTML = '';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fb-btn-submit fb-managed-trigger';
        button.textContent = this.cfg.buttonText || 'Feedback';
        this.applyThemeToElement(button);
        host.appendChild(button);
        this.generatedTrigger = button;
        els = [button];
      }
    }
    els.forEach(el => el.addEventListener('click', (e) => { if (!this.feedbackEnabled) return; e.preventDefault(); this.open(); }));
    this.log(`Attached to ${els.length} trigger(s)`);
  }

  // ---- Inline Mode ----

  private renderInline(): void {
    let target: Element | null = null;
    try {
      target = this.cfg.target ? document.querySelector(this.cfg.target) : null;
    } catch {
      this.log('Invalid inline selector');
    }
    target ||= this.findManagedHost();
    if (!target) { this.log('Inline target not found'); return; }
    const container = document.createElement('div');
    this.inlineContainer = container;
    container.className = 'fb-inline';
    container.innerHTML = this.buildFormHTML(false);
    this.applyThemeToElement(container);
    (target as HTMLElement).innerHTML = '';
    (target as HTMLElement).appendChild(container);
    this.bindForm(container, false);
    void this.renderCaptcha(container, false);
  }

  // ---- Modal ----

  open(): void {
    if (!this.feedbackEnabled) return;
    if (this.updatesController?.isOpen()) this.updatesController.closeUpdates();
    if (this.isOpen) return;
    acquireOverlay(this, 'feedback', () => this.close());
    this.isOpen = true;
    this.lastFocus = document.activeElement as HTMLElement;

    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'fb-overlay';
    this.overlayEl.addEventListener('click', (e) => { if (e.target === this.overlayEl) this.close(); });

    const modal = document.createElement('div');
    modal.className = 'fb-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', this.cfg.formTitle || 'Send Feedback');
    modal.innerHTML = this.buildFormHTML(true);

    if (this.cfg.scale && this.cfg.scale !== 1) {
      modal.style.transform = `scale(${this.cfg.scale})`;
    }

    this.overlayEl.appendChild(modal);
    this.applyThemeToElement(this.overlayEl);
    document.body.appendChild(this.overlayEl);
    document.body.style.overflow = 'hidden';

    // Trigger animation
    requestAnimationFrame(() => this.overlayEl?.classList.add('fb-visible'));

    // Focus trap
    this.setupFocusTrap(modal);

    // Focus textarea
    const ta = modal.querySelector('.fb-textarea') as HTMLTextAreaElement | null;
    setTimeout(() => ta?.focus(), 100);

    // ESC close
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { this.close(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);

    this.bindForm(modal, true);
    this.renderCaptcha(modal, true);
  }

  close(): void {
    releaseOverlay(this);
    if (!this.isOpen || !this.overlayEl) return;
    this.isOpen = false;
    this.overlayEl.classList.remove('fb-visible');
    const overlay = this.overlayEl;
    setTimeout(() => overlay.remove(), 300);
    this.overlayEl = null;
    document.body.style.overflow = '';
    if (this.lastFocus?.focus) this.lastFocus.focus();
    else this.launcher?.focus();
  }

  private setupFocusTrap(container: HTMLElement): void {
    const sel = 'button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(sel));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  // ---- Build Form HTML ----

  private buildFormHTML(isModal: boolean): string {
    const t = this.cfg;
    const showType = t.enableType !== false;
    const showRating = t.enableRating !== false;
    const id = isModal ? 'm' : 'i';

    return `
      <div class="fb-header">
        <div class="fb-header-text">
          <h3 class="fb-title">${escapeHtml(t.formTitle || 'Send Feedback')}</h3>
          <p class="fb-subtitle">${escapeHtml(t.formSubtitle || 'Help us improve by sharing your thoughts')}</p>
        </div>
        ${isModal ? `<button type="button" class="fb-close" aria-label="Close">&times;</button>` : ''}
      </div>
      <div class="fb-body">
        <form class="fb-form" novalidate>
          ${showType ? `
          <div class="fb-field">
            <label class="fb-label">Category</label>
            <div class="fb-categories" role="radiogroup" aria-label="Feedback category">
              ${(['bug','idea','praise','question'] as const).map(c => `
                <button type="button" class="fb-cat-btn" data-cat="${c}" role="radio" aria-checked="false" aria-label="${CATEGORY_META[c].label}">
                  <span class="fb-cat-icon">${CATEGORY_META[c].icon}</span>${CATEGORY_META[c].label}
                </button>`).join('')}
            </div>
          </div>` : ''}

          <div class="fb-field">
            <label for="fb-msg-${id}" class="fb-label">${escapeHtml(t.messageLabel || 'Your feedback')} *</label>
            <textarea id="fb-msg-${id}" class="fb-textarea" placeholder="${escapeHtml(t.messagePlaceholder || "What's on your mind?")}" required minlength="2" maxlength="2000"></textarea>
            <span class="fb-char-count">0 / 2,000</span>
          </div>

          ${showRating ? `
          <div class="fb-field">
            <label class="fb-label">Rating</label>
            <div class="fb-stars" role="radiogroup" aria-label="Rating">
              ${[1,2,3,4,5].map(n => `<button type="button" class="fb-star" data-val="${n}" role="radio" aria-checked="false" aria-label="${n} star${n>1?'s':''}">
                ${STAR_SVG}
              </button>`).join('')}
              <span class="fb-star-label"></span>
            </div>
          </div>` : ''}

          <div class="fb-field">
            <label for="fb-email-${id}" class="fb-label">${escapeHtml(t.emailLabel || 'Email')} ${t.requireEmail ? '*' : '(optional)'}</label>
            <input id="fb-email-${id}" type="email" class="fb-input" placeholder="you@example.com" ${t.requireEmail ? 'required' : ''} />
          </div>

          ${t.enableScreenshot ? `
          <div class="fb-field">
            <div class="fb-screenshot-row">
              <button type="button" class="fb-btn-sm fb-capture-btn">\u{1F4F8} Capture screenshot</button>
              <span class="fb-screenshot-badge"></span>
            </div>
          </div>` : ''}

          ${t.enableAttachment ? `
          <div class="fb-field">
            <label for="fb-file-${id}" class="fb-label">Attachment (optional)</label>
            <input id="fb-file-${id}" type="file" class="fb-file-input" accept="image/png,image/jpeg" />
            <span class="fb-help">PNG or JPG, max ${t.attachmentMaxMB || 5} MB</span>
          </div>` : ''}

          <input type="text" name="fb_hp" class="fb-hp" autocomplete="off" tabindex="-1" aria-hidden="true" />

          ${t.requireCaptcha ? `<div class="fb-field"><div class="fb-captcha" id="fb-captcha-${id}"></div></div>` : ''}

          <div class="fb-actions">
            ${isModal ? `<button type="button" class="fb-btn-cancel">${escapeHtml(t.cancelButtonText || 'Cancel')}</button>` : ''}
            <button type="submit" class="fb-btn-submit">${escapeHtml(t.submitButtonText || 'Send Feedback')}</button>
          </div>
        </form>
      </div>
      <div class="fb-powered">Powered by <a href="https://feedbacks.dev" target="_blank" rel="noopener">feedbacks.dev</a></div>
    `;
  }

  // ---- Bind Form Logic ----

  private bindForm(container: HTMLElement, isModal: boolean): void {
    const id = isModal ? 'm' : 'i';
    const form = container.querySelector('.fb-form') as HTMLFormElement;
    const textarea = container.querySelector(`#fb-msg-${id}`) as HTMLTextAreaElement;
    const emailInput = container.querySelector(`#fb-email-${id}`) as HTMLInputElement;
    const charCount = container.querySelector('.fb-char-count') as HTMLElement;
    const submitBtn = container.querySelector('.fb-btn-submit') as HTMLButtonElement;
    const closeBtn = container.querySelector('.fb-close') as HTMLElement | null;
    const cancelBtn = container.querySelector('.fb-btn-cancel') as HTMLElement | null;
    const captureBtn = container.querySelector('.fb-capture-btn') as HTMLButtonElement | null;
    const screenshotBadge = container.querySelector('.fb-screenshot-badge') as HTMLElement | null;
    const fileInput = container.querySelector(`#fb-file-${id}`) as HTMLInputElement | null;
    const draftStorage = this.getSessionStorage();
    const draftKey = `feedbacks:draft:${this.cfg.projectKey}`;
    let restoredDraft: { message?: string; email?: string; category?: CategoryType; rating?: number } = {};
    try {
      restoredDraft = JSON.parse(draftStorage?.getItem(draftKey) || '{}');
    } catch {
      restoredDraft = {};
    }
    if (typeof restoredDraft.message === 'string') textarea.value = restoredDraft.message.slice(0, 2000);
    if (emailInput && typeof restoredDraft.email === 'string') emailInput.value = restoredDraft.email.slice(0, 320);
    const persistDraft = () => {
      try {
        draftStorage?.setItem(draftKey, JSON.stringify({
          message: textarea.value,
          email: emailInput?.value || '',
          category: this.selectedCategory || undefined,
          rating: this.selectedRating || undefined,
        }));
      } catch {
        // Storage may be disabled; the live form remains usable.
      }
    };

    // Close / cancel
    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    // Char count
    const updateCharacterCount = () => {
      const len = textarea.value.length;
      charCount.textContent = `${len.toLocaleString()} / 2,000`;
      charCount.className = 'fb-char-count' + (len > 1950 ? ' fb-char-danger' : len > 1800 ? ' fb-char-warn' : '');
    };
    updateCharacterCount();
    textarea?.addEventListener('input', () => {
      this.clearFieldError(textarea);
      updateCharacterCount();
      persistDraft();
    });
    emailInput?.addEventListener('input', () => {
      this.clearFieldError(emailInput);
      persistDraft();
    });

    // Category buttons
    const validCategories: CategoryType[] = ['bug', 'idea', 'praise', 'question'];
    this.selectedCategory = validCategories.some((category) => category === restoredDraft.category)
      ? restoredDraft.category as CategoryType
      : '';
    container.querySelectorAll<HTMLElement>('.fb-cat-btn').forEach(btn => {
      const active = btn.dataset.cat === this.selectedCategory;
      btn.classList.toggle('fb-active', active);
      btn.setAttribute('aria-checked', String(active));
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat as CategoryType;
        this.selectedCategory = this.selectedCategory === cat ? '' : cat;
        container.querySelectorAll<HTMLElement>('.fb-cat-btn').forEach(b => {
          const active = b.dataset.cat === this.selectedCategory;
          b.classList.toggle('fb-active', active);
          b.setAttribute('aria-checked', String(active));
        });
        persistDraft();
      });
    });

    // Star rating
    this.selectedRating = Number.isInteger(restoredDraft.rating)
      && Number(restoredDraft.rating) >= 1
      && Number(restoredDraft.rating) <= 5
      ? Number(restoredDraft.rating)
      : 0;
    this.hoverRating = 0;
    const starLabel = container.querySelector('.fb-star-label') as HTMLElement | null;
    const updateStars = () => {
      const display = this.hoverRating || this.selectedRating;
      container.querySelectorAll<HTMLElement>('.fb-star').forEach(s => {
        const val = parseInt(s.dataset.val || '0');
        const svg = s.querySelector('svg path') as SVGPathElement | null;
        if (!svg) return;
        if (val <= display) {
          svg.className.baseVal = this.hoverRating ? 'fb-star-hover' : 'fb-star-filled';
        } else {
          svg.className.baseVal = 'fb-star-empty';
        }
        s.setAttribute('aria-checked', String(val === this.selectedRating));
      });
      if (starLabel) starLabel.textContent = STAR_LABELS[display] || '';
    };
    container.querySelectorAll<HTMLElement>('.fb-star').forEach(s => {
      s.addEventListener('click', () => {
        const val = parseInt(s.dataset.val || '0');
        this.selectedRating = this.selectedRating === val ? 0 : val;
        this.hoverRating = 0;
        updateStars();
        persistDraft();
      });
      s.addEventListener('mouseenter', () => { this.hoverRating = parseInt(s.dataset.val || '0'); updateStars(); });
      s.addEventListener('mouseleave', () => { this.hoverRating = 0; updateStars(); });
    });
    updateStars();

    // Screenshot
    if (captureBtn) {
      captureBtn.addEventListener('click', async () => {
        captureBtn.disabled = true;
        captureBtn.textContent = 'Capturing...';
        try {
          this.screenshotData = await this.captureScreenshot();
          if (screenshotBadge) screenshotBadge.textContent = this.screenshotData ? 'Captured' : 'Failed';
        } catch {
          if (screenshotBadge) screenshotBadge.textContent = 'Failed';
        }
        captureBtn.disabled = false;
        captureBtn.textContent = '\u{1F4F8} Capture screenshot';
      });
    }

    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot
      const hp = form.querySelector<HTMLInputElement>('[name="fb_hp"]');
      if (hp && hp.value) { this.log('Spam detected'); return; }

      const message = textarea.value.trim();
      const email = emailInput?.value.trim() || '';

      if (!message || message.length < 2) { this.showError(container, 'Feedback message: enter at least 2 characters.', textarea); return; }
      if (message.length > 2000) { this.showError(container, 'Feedback message: use no more than 2,000 characters.', textarea); return; }
      if (this.cfg.requireEmail && !email) { this.showError(container, 'Email: enter an address.', emailInput); return; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.showError(container, 'Email: enter a valid address.', emailInput); return; }
      if (!this.cfg.projectKey) { this.showError(container, 'Widget is missing a project key.'); return; }
      if (navigator.onLine === false) {
        this.showError(container, 'You appear to be offline. Your draft is saved in this tab—reconnect and try again.');
        return;
      }

      // Captcha check
      if (this.cfg.requireCaptcha) {
        const tokenEl = container.querySelector<HTMLInputElement>(`#fb-captcha-token-${id}`);
        if (!tokenEl?.value) { this.showError(container, 'Please complete the captcha.'); return; }
      }

      // Attachment validation
      const file = fileInput?.files?.[0];
      if (file) {
        const maxMB = this.cfg.attachmentMaxMB || 5;
        const allowed = (this.cfg.allowedAttachmentMimes || ['image/png','image/jpeg'])
          .filter((type): type is 'image/png' | 'image/jpeg' => type === 'image/png' || type === 'image/jpeg');
        if (!allowed.some(type => type === file.type)) { this.showError(container, 'Attachment: choose a PNG or JPG file.', fileInput); return; }
        if (file.size > maxMB * 1024 * 1024) { this.showError(container, `Attachment: choose a file smaller than ${maxMB} MB.`, fileInput); return; }
      }

      this.setLoading(submitBtn, true);

      try {
        const submissionId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : undefined;
        const captchaToken = container.querySelector<HTMLInputElement>(`#fb-captcha-token-${id}`)?.value || '';
        let response: FeedbackResponse;

        if (file) {
          const fd = new FormData();
          fd.append('apiKey', this.cfg.projectKey);
          if (submissionId) fd.append('submissionId', submissionId);
          fd.append('message', message);
          if (email) fd.append('email', email);
          fd.append('url', sanitizeFeedbackPageUrl(window.location.href));
          fd.append('userAgent', navigator.userAgent);
          if (this.selectedCategory) fd.append('type', this.selectedCategory);
          if (this.selectedRating) fd.append('rating', String(this.selectedRating));
          if (this.screenshotData) fd.append('screenshot', this.screenshotData);
          if (captchaToken) fd.append(this.cfg.captchaProvider === 'hcaptcha' ? 'hcaptchaToken' : 'turnstileToken', captchaToken);
          fd.append('attachment', file);
          response = await this.submitData(fd);
        } else {
          const data: FeedbackData = {
            apiKey: this.cfg.projectKey,
            submissionId,
            message,
            email: email || undefined,
            url: sanitizeFeedbackPageUrl(window.location.href),
            userAgent: navigator.userAgent,
            type: this.selectedCategory || undefined,
            rating: this.selectedRating || undefined,
            screenshot: this.screenshotData || undefined,
            turnstileToken: this.cfg.captchaProvider === 'turnstile' ? captchaToken || undefined : undefined,
            hcaptchaToken: this.cfg.captchaProvider === 'hcaptcha' ? captchaToken || undefined : undefined,
          };
          response = await this.submitData(data);
        }

        window.dispatchEvent(new CustomEvent('feedbacks:submitted', {
          detail: { id: response.id },
        }));
        draftStorage?.removeItem(draftKey);
        this.showSuccess(container, isModal);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send feedback. Please try again.';
        this.showError(container, msg);
        this.setLoading(submitBtn, false);
      }
    });
  }

  // ---- API ----

  private async submitData(data: FeedbackData | FormData, attempt = 1): Promise<FeedbackResponse> {
    const url = this.cfg.apiUrl || 'https://app.feedbacks.dev/api/feedback';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const isForm = data instanceof FormData;
      const res = await fetch(url, {
        method: 'POST',
        headers: isForm ? undefined : { 'Content-Type': 'application/json' },
        body: isForm ? data : JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const error = new Error((json?.error || json?.message) || `HTTP ${res.status}`) as Error & { retriable?: boolean };
        error.retriable = res.status === 408 || res.status === 429 || res.status >= 500;
        throw error;
      }
      return json as FeedbackResponse;
    } catch (err) {
      clearTimeout(timeout);
      const retryable = (err as Error & { retriable?: boolean })?.retriable
        || err instanceof TypeError
        || (err instanceof DOMException && err.name === 'AbortError');
      if (attempt < this.maxRetries && retryable) {
        this.log(`Attempt ${attempt} failed, retrying...`);
        await new Promise(r => setTimeout(r, 500 * attempt));
        return this.submitData(data, attempt + 1);
      }
      throw err;
    }
  }

  // ---- Screenshot ----

  private async captureScreenshot(): Promise<string | null> {
    const w = window as unknown as Record<string, unknown>;
    if (!w.html2canvas) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        s.integrity = 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H';
        s.crossOrigin = 'anonymous';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(s);
      });
    }
    const h2c = w.html2canvas as ((el: HTMLElement, opts: Record<string, unknown>) => Promise<HTMLCanvasElement>) | undefined;
    if (!h2c) return null;
    // Hide our overlay before capture
    if (this.overlayEl) this.overlayEl.style.display = 'none';
    try {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const canvas = await h2c(document.body, {
        useCORS: true,
        logging: false,
        scale: 1,
        x: window.scrollX,
        y: window.scrollY,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        width: viewportWidth,
        height: viewportHeight,
        windowWidth: viewportWidth,
        windowHeight: viewportHeight,
      });
      return this.encodeScreenshot(canvas);
    } finally {
      if (this.overlayEl) this.overlayEl.style.display = '';
    }
  }

  private encodeScreenshot(source: HTMLCanvasElement): string | null {
    const maxWidth = 1920;
    const maxHeight = 1080;
    const maxBytes = 2.8 * 1024 * 1024;
    const scale = Math.min(1, maxWidth / source.width, maxHeight / source.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));

    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.68, 0.54]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const separatorIndex = dataUrl.indexOf(',');
      const estimatedBytes = Math.ceil((dataUrl.length - separatorIndex - 1) * 0.75);
      if (estimatedBytes <= maxBytes) return dataUrl;
    }

    const fallback = canvas.toDataURL('image/jpeg', 0.42);
    const separatorIndex = fallback.indexOf(',');
    const estimatedBytes = Math.ceil((fallback.length - separatorIndex - 1) * 0.75);
    return estimatedBytes <= maxBytes ? fallback : null;
  }

  // ---- Captcha ----

  private async renderCaptcha(container: HTMLElement, isModal: boolean): Promise<void> {
    if (!this.cfg.requireCaptcha) return;
    const id = isModal ? 'm' : 'i';
    const el = container.querySelector(`#fb-captcha-${id}`) as HTMLElement | null;
    if (!el) return;

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = `fb-captcha-token-${id}`;
    el.parentElement?.appendChild(hidden);

    try {
      if (this.cfg.captchaProvider === 'turnstile' && this.cfg.turnstileSiteKey) {
        await this.loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js');
        const turnstile = (window as unknown as Record<string, unknown>).turnstile as { render: (el: HTMLElement, opts: Record<string, unknown>) => void } | undefined;
        turnstile?.render(el, {
          sitekey: this.cfg.turnstileSiteKey,
          callback: (token: string) => { hidden.value = token; },
        });
      } else if (this.cfg.captchaProvider === 'hcaptcha' && this.cfg.hcaptchaSiteKey) {
        await this.loadScript('https://js.hcaptcha.com/1/api.js?render=explicit');
        const hcaptcha = (window as unknown as Record<string, unknown>).hcaptcha as { render: (el: HTMLElement, opts: Record<string, unknown>) => void } | undefined;
        hcaptcha?.render(el, {
          sitekey: this.cfg.hcaptchaSiteKey,
          callback: (token: string) => { hidden.value = token; },
        });
      }
    } catch { this.log('Captcha load failed'); }
  }

  private async loadScript(src: string): Promise<void> {
    if (document.querySelector(`script[src="${src}"]`)) return;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject();
      document.head.appendChild(s);
    });
  }

  // ---- UI helpers ----

  private setLoading(btn: HTMLButtonElement, loading: boolean): void {
    btn.disabled = loading;
    if (loading) {
      btn.innerHTML = `<span class="fb-spinner"></span> Sending…`;
    } else {
      btn.textContent = this.cfg.submitButtonText || 'Send Feedback';
    }
  }

  private clearFieldError(field: HTMLElement): void {
    const errorId = field.getAttribute('aria-describedby');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    if (errorId?.startsWith('fb-field-error-')) {
      const root = field.getRootNode() as Document | ShadowRoot;
      root.getElementById(errorId)?.remove();
    }
  }

  private showError(container: HTMLElement, message: string, field?: HTMLElement | null): void {
    container.querySelector('.fb-error')?.remove();
    container.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach((item) => this.clearFieldError(item));
    const body = container.querySelector('.fb-body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'fb-error';
    div.setAttribute('role', 'alert');
    if (field) {
      const errorId = `fb-field-error-${field.id || 'field'}`;
      div.id = errorId;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', errorId);
    }
    div.textContent = message;
    body.insertBefore(div, body.firstChild);
    field?.focus();
  }

  private showSuccess(container: HTMLElement, isModal: boolean): void {
    const title = this.cfg.successTitle || 'Thank you!';
    const desc = this.cfg.successDescription || 'Your feedback has been sent successfully.';

    const header = container.querySelector('.fb-header');
    const body = container.querySelector('.fb-body');
    const powered = container.querySelector('.fb-powered');
    if (header) header.remove();
    if (powered) powered.remove();
    if (body) {
      body.innerHTML = `
        <div class="fb-success">
          <div class="fb-success-icon">${CHECK_SVG}</div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(desc)}</p>
          ${isModal ? `<button type="button" class="fb-btn-submit">Close</button>` : ''}
        </div>
      `;
      const closeBtn = body.querySelector('.fb-btn-submit');
      closeBtn?.addEventListener('click', () => this.close());
    }

    if (isModal) {
      setTimeout(() => { if (this.isOpen) this.close(); }, 4000);
    } else {
      setTimeout(() => {
        if (container.parentElement) {
          container.innerHTML = this.buildFormHTML(false);
          this.bindForm(container, false);
        }
      }, 5000);
    }
  }

  private log(msg: string): void {
    if (this.cfg.debug) console.log('[Feedbacks]', msg);
  }

  destroy(): void {
    this.destroyed = true;
    this.bootstrapController?.abort();
    this.bootstrapController = null;
    if (this.autoOpenTimer !== null) {
      window.clearTimeout(this.autoOpenTimer);
      this.autoOpenTimer = null;
    }
    this.updatesController?.destroy();
    this.updatesController = null;
    releaseOverlay(this);
    this.launcher?.remove();
    this.generatedTrigger?.remove();
    this.generatedTrigger = null;
    this.inlineContainer?.remove();
    this.inlineContainer = null;
    this.overlayEl?.remove();
    this.styleEl?.remove();
    if (this.boundKeydownHandler) {
      document.removeEventListener('keydown', this.boundKeydownHandler);
      this.boundKeydownHandler = null;
    }
    document.body.style.overflow = '';
  }

  openUpdates(): Promise<boolean> { return this.updatesController?.openUpdates() || Promise.resolve(false); }
  closeUpdates(): void { this.updatesController?.closeUpdates(); }
  getUnreadUpdateCount(): number { return this.updatesController?.getUnreadUpdateCount() || 0; }
  refreshUpdates(): Promise<void> { return this.updatesController?.refreshUpdates() || Promise.resolve(); }
}

export default FeedbacksWidget;
