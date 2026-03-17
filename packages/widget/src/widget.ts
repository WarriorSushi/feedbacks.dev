import styles from './styles.css';
import type { WidgetConfig, FeedbackData, FeedbackResponse, CategoryType } from './types';

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
  bug:   { icon: '\u{1F41B}', label: 'Bug' },
  idea:  { icon: '\u{1F4A1}', label: 'Idea' },
  praise:{ icon: '\u{1F389}', label: 'Praise' },
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
    this.injectStyles();
    this.applyTheme();

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
      document.addEventListener('keydown', (e) => {
        const modOk = (!parts.includes('shift') || e.shiftKey) &&
                      (!parts.includes('ctrl') || e.ctrlKey) &&
                      (!parts.includes('alt') || e.altKey);
        if (modOk && e.key.toLowerCase() === key) {
          e.preventDefault();
          this.isOpen ? this.close() : this.open();
        }
      });
    }

    // Auto-open
    if (this.cfg.openAfterMs && this.cfg.openAfterMs > 0) {
      setTimeout(() => { if (!this.isOpen) this.open(); }, this.cfg.openAfterMs);
    }

    this.log('Widget initialized');
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
    const root = document.documentElement;
    // Inherit host font
    try {
      const hostFont = getComputedStyle(document.body).fontFamily;
      if (hostFont) root.style.setProperty('--fb-font', hostFont);
    } catch { /* ignore */ }

    const color = this.cfg.primaryColor || '#6366f1';
    root.style.setProperty('--fb-primary', color);
    root.style.setProperty('--fb-primary-hover', darkenHex(color));
    const rgb = parseHexRGB(color);
    if (rgb) root.style.setProperty('--fb-primary-rgb', rgb.join(', '));

    if (this.cfg.backgroundColor) {
      root.style.setProperty('--fb-bg', this.cfg.backgroundColor);
      // Auto text color based on bg luminance
      if (!isLightColor(this.cfg.backgroundColor)) {
        root.style.setProperty('--fb-text', '#f8fafc');
        root.style.setProperty('--fb-text-muted', 'rgba(248,250,252,0.7)');
        root.style.setProperty('--fb-border', 'rgba(255,255,255,0.15)');
        root.style.setProperty('--fb-bg-secondary', 'rgba(255,255,255,0.06)');
      }
    }

    if (this.cfg.modalWidth) {
      root.style.setProperty('--fb-modal-width', this.cfg.modalWidth + 'px');
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
    document.body.appendChild(this.launcher);
  }

  // ---- Trigger Mode ----

  private attachTriggers(): void {
    const sel = this.cfg.target || '[data-feedbacks-trigger]';
    const els = document.querySelectorAll(sel);
    els.forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); this.open(); }));
    this.log(`Attached to ${els.length} trigger(s)`);
  }

  // ---- Inline Mode ----

  private renderInline(): void {
    const target = this.cfg.target ? document.querySelector(this.cfg.target) : null;
    if (!target) { this.log('Inline target not found'); return; }
    const container = document.createElement('div');
    container.className = 'fb-inline';
    container.innerHTML = this.buildFormHTML(false);
    (target as HTMLElement).innerHTML = '';
    (target as HTMLElement).appendChild(container);
    this.bindForm(container, false);
  }

  // ---- Modal ----

  open(): void {
    if (this.isOpen) return;
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
              ${(['bug','idea','praise'] as const).map(c => `
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
            <input id="fb-file-${id}" type="file" class="fb-file-input" accept="image/png,image/jpeg,application/pdf" />
            <span class="fb-help">Max ${t.attachmentMaxMB || 5} MB</span>
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

    // Close / cancel
    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    // Char count
    textarea?.addEventListener('input', () => {
      const len = textarea.value.length;
      charCount.textContent = `${len.toLocaleString()} / 2,000`;
      charCount.className = 'fb-char-count' + (len > 1950 ? ' fb-char-danger' : len > 1800 ? ' fb-char-warn' : '');
    });

    // Category buttons
    this.selectedCategory = '';
    container.querySelectorAll<HTMLElement>('.fb-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.cat as CategoryType;
        this.selectedCategory = this.selectedCategory === cat ? '' : cat;
        container.querySelectorAll<HTMLElement>('.fb-cat-btn').forEach(b => {
          const active = b.dataset.cat === this.selectedCategory;
          b.classList.toggle('fb-active', active);
          b.setAttribute('aria-checked', String(active));
        });
      });
    });

    // Star rating
    this.selectedRating = 0;
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

      if (!message || message.length < 2) { this.showError(container, 'Please enter your feedback (at least 2 characters).'); return; }
      if (message.length > 2000) { this.showError(container, 'Feedback is too long (max 2,000 characters).'); return; }
      if (this.cfg.requireEmail && !email) { this.showError(container, 'Email is required.'); return; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.showError(container, 'Please enter a valid email.'); return; }
      if (!this.cfg.projectKey) { this.showError(container, 'Widget is missing a project key.'); return; }

      // Captcha check
      if (this.cfg.requireCaptcha) {
        const tokenEl = container.querySelector<HTMLInputElement>(`#fb-captcha-token-${id}`);
        if (!tokenEl?.value) { this.showError(container, 'Please complete the captcha.'); return; }
      }

      // Attachment validation
      const file = fileInput?.files?.[0];
      if (file) {
        const maxMB = this.cfg.attachmentMaxMB || 5;
        const allowed = this.cfg.allowedAttachmentMimes || ['image/png','image/jpeg','application/pdf'];
        if (!allowed.includes(file.type)) { this.showError(container, 'Unsupported file type.'); return; }
        if (file.size > maxMB * 1024 * 1024) { this.showError(container, `File too large (max ${maxMB} MB).`); return; }
      }

      this.setLoading(submitBtn, true);

      try {
        const captchaToken = container.querySelector<HTMLInputElement>(`#fb-captcha-token-${id}`)?.value || '';

        if (file) {
          const fd = new FormData();
          fd.append('apiKey', this.cfg.projectKey);
          fd.append('message', message);
          if (email) fd.append('email', email);
          fd.append('url', window.location.href);
          fd.append('userAgent', navigator.userAgent);
          if (this.selectedCategory) fd.append('type', this.selectedCategory);
          if (this.selectedRating) fd.append('rating', String(this.selectedRating));
          if (this.screenshotData) fd.append('screenshot', this.screenshotData);
          if (captchaToken) fd.append(this.cfg.captchaProvider === 'hcaptcha' ? 'hcaptchaToken' : 'turnstileToken', captchaToken);
          fd.append('attachment', file);
          await this.submitData(fd);
        } else {
          const data: FeedbackData = {
            apiKey: this.cfg.projectKey,
            message,
            email: email || undefined,
            url: window.location.href,
            userAgent: navigator.userAgent,
            type: this.selectedCategory || undefined,
            rating: this.selectedRating || undefined,
            screenshot: this.screenshotData || undefined,
            turnstileToken: this.cfg.captchaProvider === 'turnstile' ? captchaToken || undefined : undefined,
            hcaptchaToken: this.cfg.captchaProvider === 'hcaptcha' ? captchaToken || undefined : undefined,
          };
          await this.submitData(data);
        }

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
      if (!res.ok) throw new Error((json?.error || json?.message) || `HTTP ${res.status}`);
      return json as FeedbackResponse;
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < this.maxRetries) {
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
      const canvas = await h2c(document.body, { useCORS: true, logging: false, scale: 1 });
      return canvas.toDataURL('image/png');
    } finally {
      if (this.overlayEl) this.overlayEl.style.display = '';
    }
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
      btn.innerHTML = `<span class="fb-spinner"></span> Sending...`;
    } else {
      btn.textContent = this.cfg.submitButtonText || 'Send Feedback';
    }
  }

  private showError(container: HTMLElement, message: string): void {
    container.querySelector('.fb-error')?.remove();
    const body = container.querySelector('.fb-body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'fb-error';
    div.textContent = message;
    body.insertBefore(div, body.firstChild);
    setTimeout(() => div.remove(), 5000);
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
    this.launcher?.remove();
    this.overlayEl?.remove();
    this.styleEl?.remove();
    document.body.style.overflow = '';
  }
}

export default FeedbacksWidget;
