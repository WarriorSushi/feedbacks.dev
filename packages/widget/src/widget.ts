import './styles.css';
import { FeedbackData, FeedbackResponse, WidgetConfig } from './types';

class FeedbacksWidget {
  private config: WidgetConfig;
  private isOpen = false;
  private button: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private lastFocusedElement: HTMLElement | null = null;
  private screenshotData: string | null = null;

  constructor(config: WidgetConfig) {
    this.config = { position: 'bottom-right', embedMode: 'modal', ...config };
    this.init();
  }

  // Backwards-compatible initializer for CDN demos and simple usage
  static init(config: WidgetConfig): FeedbacksWidget {
    return new FeedbacksWidget(config);
  }

  private init(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  private setup(): void {
    // Attempt to adapt font and colors from host page if not explicitly provided
    this.adaptLookAndFeel();
    if (this.config.embedMode === 'inline') {
      this.createInlineForm();
    } else if (this.config.embedMode === 'trigger') {
      this.attachTriggerListeners();
    } else {
      this.createButton(); // Default modal mode
      this.attachEventListeners();
    }
    this.log('Widget initialized successfully');
  }

  // Try to inherit font-family and a reasonable primary color from host
  private adaptLookAndFeel(): void {
    try {
      const body = document.body;
      const style = getComputedStyle(body);
      const fontFamily = style.fontFamily || '';
      const link = document.querySelector('a');
      const linkColor = link ? getComputedStyle(link).color : '';
      const primary = this.config.primaryColor || linkColor || '';
      // Apply font to document-level CSS variable used by our styles (if present)
      if (fontFamily) {
        document.documentElement.style.setProperty('--feedbacks-font-family', fontFamily);
      }
      if (primary) {
        document.documentElement.style.setProperty('--feedbacks-primary', primary);
      }
    } catch {}
  }

  private log(message: string): void {
    if (this.config.debug) {
      console.log('[Feedbacks Widget]', message);
    }
  }

  private createButton(): void {
    this.button = document.createElement('button');
    this.button.className = `feedbacks-button position-${this.config.position}`;
    // Use a chat bubble icon SVG by default, or custom text if provided
    this.button.innerHTML = this.config.buttonText || `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    `;
    this.button.title = 'Send feedback';
    this.button.setAttribute('aria-label', 'Open feedback form');
    
    if (this.config.primaryColor) {
      this.button.style.background = this.config.primaryColor;
    }
    
    document.body.appendChild(this.button);
  }

  private createInlineForm(): void {
    const target = this.config.target ? 
      document.querySelector(this.config.target) : 
      document.body;
      
    if (!target) {
      this.log('Target element not found, falling back to body');
      return;
    }

    const container = document.createElement('div');
    container.className = 'feedbacks-inline-container';
    container.innerHTML = this.getFormHTML(false);
    
    target.appendChild(container);
    this.attachFormHandlers(container, false);
    this.renderCaptcha(container, false);
  }

  private attachTriggerListeners(): void {
    const triggers = this.config.target ?
      document.querySelectorAll(this.config.target) :
      document.querySelectorAll('[data-feedbacks-trigger]');
      
    triggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });
    
    this.log(`Attached to ${triggers.length} trigger elements`);
  }

  private getFormHTML(isModal = false): string {
    const idSuffix = isModal ? '-modal' : '-inline';
    const showType = this.config.enableType !== false; // default true
    const showRating = this.config.enableRating !== false; // default true
    return `
      <div class="feedbacks-widget">
        <div class="feedbacks-header">
          <h3 class="feedbacks-title">Send Feedback</h3>
          <p class="feedbacks-subtitle">Help us improve by sharing your thoughts</p>
          ${isModal ? '<button type="button" class="feedbacks-close" aria-label="Close feedback form">✕</button>' : ''}
        </div>
        <div class="feedbacks-content">
          <form class="feedbacks-form">
            <div class="feedbacks-field">
              <label for="feedbacks-message${idSuffix}" class="feedbacks-label">Your feedback *</label>
              <textarea
                id="feedbacks-message${idSuffix}"
                class="feedbacks-textarea"
                placeholder="What's on your mind? Any bugs, suggestions, or general feedback..."
                required
                maxlength="2000"
              ></textarea>
              <div class="feedbacks-char-count">0/2000</div>
            </div>
            ${showType ? `
            <div class=\"feedbacks-field\">
              <label for=\"feedbacks-type${idSuffix}\" class=\"feedbacks-label\">Category (optional)</label>
              <select id=\"feedbacks-type${idSuffix}\" class=\"feedbacks-input\">
                <option value=\"\">Select a category</option>
                <option value=\"bug\">Bug</option>
                <option value=\"idea\">Idea</option>
                <option value=\"praise\">Praise</option>
              </select>
            </div>` : ''}
            ${showRating ? `
            <div class=\"feedbacks-field\">
              <label for=\"feedbacks-rating${idSuffix}\" class=\"feedbacks-label\">Rating (optional)</label>
              <select id=\"feedbacks-rating${idSuffix}\" class=\"feedbacks-input\">
                <option value=\"\">No rating</option>
                <option value=\"1\">1</option>
                <option value=\"2\">2</option>
                <option value=\"3\">3</option>
                <option value=\"4\">4</option>
                <option value=\"5\">5</option>
              </select>
            </div>` : ''}
            <div class="feedbacks-field">
              <label for="feedbacks-email${idSuffix}" class="feedbacks-label">Email ${this.config.requireEmail ? '(required)' : '(optional)'} </label>
              <input
                id="feedbacks-email${idSuffix}"
                type="email"
                class="feedbacks-input"
                placeholder="your@email.com"
              />
            </div>
            ${this.config.enablePriority ? `
            <div class=\"feedbacks-field\">
              <label for=\"feedbacks-priority${idSuffix}\" class=\"feedbacks-label\">Priority (optional)</label>
              <select id=\"feedbacks-priority${idSuffix}\" class=\"feedbacks-input\">
                <option value=\"\">No priority</option>
                <option value=\"low\">Low</option>
                <option value=\"medium\">Medium</option>
                <option value=\"high\">High</option>
              </select>
            </div>` : ''}
            ${this.config.enableTags ? `
            <div class=\"feedbacks-field\">
              <label for=\"feedbacks-tags${idSuffix}\" class=\"feedbacks-label\">Tags (comma separated)</label>
              <input id=\"feedbacks-tags${idSuffix}\" type=\"text\" class=\"feedbacks-input\" placeholder=\"bug, mobile, checkout\" />
            </div>` : ''}
            ${this.config.enableScreenshot ? `
            <div class=\"feedbacks-field\">
              <label class=\"feedbacks-label\">
                <input type=\"checkbox\" id=\"feedbacks-include-screenshot${idSuffix}\" ${this.config.screenshotRequired ? 'checked' : ''} /> Include page screenshot ${this.config.screenshotRequired ? '(required)' : ''}
              </label>
              <div class=\"flex gap-2 mt-2\">
                <button type=\"button\" id=\"feedbacks-capture${idSuffix}\" class=\"feedbacks-btn feedbacks-btn-secondary\" style=\"display:${this.config.screenshotRequired ? 'inline-flex' : 'none'}\">Capture Screenshot</button>
                <span class=\"feedbacks-screenshot-status\"></span>
              </div>
            </div>` : ''}
            ${this.config.enableAttachment ? `
            <div class=\"feedbacks-field\">
              <label for=\"feedbacks-attachment${idSuffix}\" class=\"feedbacks-label\">Attachment (optional)</label>
              <input id=\"feedbacks-attachment${idSuffix}\" type=\"file\" class=\"feedbacks-input\" accept=\"image/png,image/jpeg,application/pdf\" />
              <div class=\"feedbacks-help\">Max ${(this.config.attachmentMaxMB || 5)} MB. PNG, JPEG, or PDF only.</div>
            </div>` : ''}
            <input type=\"text\" name=\"hp\" class=\"feedbacks-hp\" autocomplete=\"off\" tabindex=\"-1\" aria-hidden=\"true\" style=\"position:absolute;left:-9999px;opacity:0\" />
            ${this.config.requireCaptcha ? `
            <div class=\"feedbacks-field\">
              <label class=\"feedbacks-label\">Captcha</label>
              <div id=\"feedbacks-captcha${idSuffix}\"></div>
              ${this.config.captchaProvider === 'turnstile' ? `<input type=\"hidden\" id=\"feedbacks-turnstile-token${idSuffix}\" name=\"turnstileToken\" />` : ''}
              ${this.config.captchaProvider === 'hcaptcha' ? `<input type=\"hidden\" id=\"feedbacks-hcaptcha-token${idSuffix}\" name=\"hcaptchaToken\" />` : ''}
            </div>` : ''}
            <div class="feedbacks-actions">
              ${isModal ? '<button type="button" class="feedbacks-btn feedbacks-btn-secondary">Cancel</button>' : ''}
              <button type="submit" class="feedbacks-btn feedbacks-btn-primary">
                Send Feedback
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    this.button?.addEventListener('click', () => this.open());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  private open(): void {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.lastFocusedElement = (document.activeElement as HTMLElement) || null;
    this.createModal();
    this.log('Modal opened');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  private close(): void {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    // Restore focus back to trigger/button
    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus();
    } else if (this.button && typeof (this.button as any).focus === 'function') {
      (this.button as any).focus();
    }
    this.log('Modal closed');
  }

  private createModal(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'feedbacks-overlay';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    const modal = document.createElement('div');
    modal.className = 'feedbacks-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'feedbacks-title');
    
    modal.innerHTML = this.getFormHTML(true);

    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);

    // Focus management
    const textarea = modal.querySelector('#feedbacks-message-modal') as HTMLTextAreaElement;
    setTimeout(() => textarea?.focus(), 100);

    // Focus trap within modal
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type=\"text\"]:not([disabled])',
      'input[type=\"email\"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex=\"-1\"])'
    ].join(',');
    const getFocusable = () => Array.from(modal.querySelectorAll<HTMLElement>(focusableSelectors));
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (!active || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!active || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    modal.addEventListener('keydown', handleKeydown);

    // Attach handlers and captcha
    this.attachFormHandlers(modal, true);
    this.renderCaptcha(modal, true);
  }

  private async loadScript(src: string): Promise<void> {
    if (document.querySelector(`script[src="${src}"]`)) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.defer = true;
      s.onload = () => resolve(); s.onerror = () => reject(new Error('script load failed'));
      document.head.appendChild(s);
    });
  }

  private async renderCaptcha(container: HTMLElement, isModal: boolean): Promise<void> {
    if (!this.config.requireCaptcha) return;
    const provider = this.config.captchaProvider;
    const idSuffix = isModal ? '-modal' : '-inline';
    const el = container.querySelector(`#feedbacks-captcha${idSuffix}`) as HTMLElement | null;
    if (!el) return;
    try {
      if (provider === 'turnstile' && this.config.turnstileSiteKey) {
        await this.loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js');
        const hidden = container.querySelector(`#feedbacks-turnstile-token${idSuffix}`) as HTMLInputElement | null;
        (window as any).turnstile.render(el, {
          sitekey: this.config.turnstileSiteKey,
          callback: (token: string) => { if (hidden) hidden.value = token; },
        });
      } else if (provider === 'hcaptcha' && this.config.hcaptchaSiteKey) {
        await this.loadScript('https://js.hcaptcha.com/1/api.js?render=explicit');
        const hidden = container.querySelector(`#feedbacks-hcaptcha-token${idSuffix}`) as HTMLInputElement | null;
        (window as any).hcaptcha.render(el, {
          sitekey: this.config.hcaptchaSiteKey,
          callback: (token: string) => { if (hidden) hidden.value = token; },
        });
      }
    } catch (e) {
      this.log('Captcha render failed');
    }
  }

  private attachFormHandlers(container: HTMLElement, isModal = true): void {
    const idSuffix = isModal ? '-modal' : '-inline';
    const form = container.querySelector('form') as HTMLFormElement;
    const textarea = container.querySelector(`#feedbacks-message${idSuffix}`) as HTMLTextAreaElement;
    const emailInput = container.querySelector(`#feedbacks-email${idSuffix}`) as HTMLInputElement;
    const typeSelect = container.querySelector(`#feedbacks-type${idSuffix}`) as HTMLSelectElement | null;
    const ratingSelect = container.querySelector(`#feedbacks-rating${idSuffix}`) as HTMLSelectElement | null;
    const prioritySelect = container.querySelector(`#feedbacks-priority${idSuffix}`) as HTMLSelectElement | null;
    const tagsInput = container.querySelector(`#feedbacks-tags${idSuffix}`) as HTMLInputElement | null;
    const includeShot = container.querySelector(`#feedbacks-include-screenshot${idSuffix}`) as HTMLInputElement | null;
    const captureBtn = container.querySelector(`#feedbacks-capture${idSuffix}`) as HTMLButtonElement | null;
    const shotStatus = container.querySelector('.feedbacks-screenshot-status') as HTMLElement | null;
    const fileInput = container.querySelector(`#feedbacks-attachment${idSuffix}`) as HTMLInputElement | null;
    const cancelBtn = container.querySelector('.feedbacks-btn-secondary') as HTMLButtonElement;
    const closeBtn = container.querySelector('.feedbacks-close') as HTMLButtonElement;
    const submitBtn = container.querySelector('.feedbacks-btn-primary') as HTMLButtonElement;
    const charCount = container.querySelector('.feedbacks-char-count') as HTMLElement;

    if (!form || !textarea || !submitBtn) {
      this.log('Required form elements not found');
      return;
    }

    // Character counter
    textarea.addEventListener('input', () => {
      const count = textarea.value.length;
      charCount.textContent = `${count}/2000`;
      charCount.style.color = count > 1900 ? '#dc2626' : '#9ca3af';
    });

    // Close handlers (only for modal)
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Screenshot capture
    if (includeShot && captureBtn) {
      const updateCaptureVisibility = () => {
        captureBtn.style.display = includeShot.checked ? 'inline-flex' : 'none';
        if (!includeShot.checked) this.screenshotData = null;
        if (shotStatus) shotStatus.textContent = this.screenshotData ? 'Captured ✓' : '';
      };
      includeShot.addEventListener('change', updateCaptureVisibility);
      updateCaptureVisibility();

      captureBtn.addEventListener('click', async () => {
        captureBtn.disabled = true;
        captureBtn.textContent = 'Capturing…';
        try {
          const dataUrl = await this.captureScreenshot();
          this.screenshotData = dataUrl;
          if (shotStatus) shotStatus.textContent = dataUrl ? 'Captured ✓' : 'Capture failed';
        } catch {
          if (shotStatus) shotStatus.textContent = 'Capture failed';
        } finally {
          captureBtn.disabled = false;
          captureBtn.textContent = 'Capture Screenshot';
        }
      });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const message = textarea.value.trim();
      const email = emailInput.value.trim();

      if (!message || message.length < 2) {
        this.showError('Please enter your feedback (at least 2 characters)');
        return;
      }

      if (message.length > 2000) {
        this.showError('Feedback is too long (maximum 2000 characters)');
        return;
      }

      if (this.config.requireEmail && !email) {
        this.showError('Email is required');
        return;
      }
      if (this.config.requireEmail && !email) {
        this.showError('Email is required');
        return;
      }
      if (email && !this.isValidEmail(email)) {
        this.showError('Please enter a valid email address');
        return;
      }

      if (includeShot && includeShot.checked && !this.screenshotData && this.config.screenshotRequired) {
        this.showError('Please capture a screenshot');
        return;
      }

      this.setSubmitState(submitBtn, true);

      try {
        const hasFile = !!(fileInput && fileInput.files && fileInput.files[0]);
        if (hasFile) {
          const file = fileInput!.files![0];
          const maxMB = this.config.attachmentMaxMB || 5;
          const allowed = this.config.allowedAttachmentMimes || ['image/png','image/jpeg','application/pdf'];
          if (!allowed.includes(file.type)) {
            this.showError('Unsupported attachment type');
            this.setSubmitState(submitBtn, false);
            return;
          }
          if (file.size > maxMB * 1024 * 1024) {
            this.showError('Attachment too large');
            this.setSubmitState(submitBtn, false);
            return;
          }
          const form = new FormData();
          form.append('apiKey', this.config.projectKey);
          form.append('message', message);
          if (email) form.append('email', email);
          form.append('url', window.location.href);
          form.append('userAgent', navigator.userAgent);
          if (typeSelect && typeSelect.value) form.append('type', typeSelect.value);
          if (ratingSelect && ratingSelect.value) form.append('rating', ratingSelect.value);
          if (prioritySelect && prioritySelect.value) form.append('priority', prioritySelect.value);
          if (tagsInput && tagsInput.value) form.append('tags', tagsInput.value);
          if (includeShot && includeShot.checked && this.screenshotData) form.append('screenshot', this.screenshotData);
          form.append('attachment', file);
          await this.submitFeedback(form as any);
        } else {
          await this.submitFeedback({
            apiKey: this.config.projectKey,
            message,
            email: email || undefined,
            url: window.location.href,
            userAgent: navigator.userAgent,
            type: typeSelect && typeSelect.value ? (typeSelect.value as 'bug' | 'idea' | 'praise') : undefined,
            rating: ratingSelect && ratingSelect.value ? parseInt(ratingSelect.value, 10) : undefined,
            priority: prioritySelect && prioritySelect.value ? (prioritySelect.value as any) : undefined,
            tags: tagsInput && tagsInput.value ? tagsInput.value.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            screenshot: includeShot && includeShot.checked && this.screenshotData ? this.screenshotData : undefined,
          });
        }
        
        if (isModal) {
          this.showSuccess();
        } else {
          this.showInlineSuccess(container);
        }
        this.log('Feedback submitted successfully');
      } catch (error) {
        this.log(`Submission failed: ${error}`);
        this.showError('Failed to send feedback. Please try again or contact support.');
        this.setSubmitState(submitBtn, false);
      }
    });
  }

  private async submitFeedback(data: FeedbackData | FormData): Promise<FeedbackResponse> {
    return this.submitWithRetry(data);
  }

  private async submitWithRetry(data: FeedbackData | FormData, attempt = 1): Promise<FeedbackResponse> {
    try {
      const apiUrl = this.config.apiUrl || 'https://app.feedbacks.dev/api/feedback';
      let response: Response;
      if (typeof FormData !== 'undefined' && data instanceof FormData) {
        response = await fetch(apiUrl, { method: 'POST', body: data });
      } else {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.maxRetries) {
        this.log(`Attempt ${attempt} failed, retrying...`);
        await this.delay(400 * attempt); // Exponential backoff
        return this.submitWithRetry(data, attempt + 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async captureScreenshot(): Promise<string | null> {
    const w = window as any;
    if (!w.html2canvas) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('html2canvas load failed'));
        document.head.appendChild(s);
      });
    }
    if (!w.html2canvas) return null;
    const canvas = await w.html2canvas(document.body, { useCORS: true, logging: false, scale: 1 });
    return canvas.toDataURL('image/png');
  }

  private setSubmitState(button: HTMLButtonElement, loading: boolean): void {
    button.disabled = loading;
    
    if (loading) {
      button.innerHTML = `
        <span class="feedbacks-spinner"></span>
        Sending...
      `;
    } else {
      button.innerHTML = 'Send Feedback';
    }
  }

  private showSuccess(): void {
    if (!this.overlay) return;

    const modal = this.overlay.querySelector('.feedbacks-modal') as HTMLElement;
    modal.innerHTML = `
      <div class="feedbacks-success">
        <div class="feedbacks-success-icon">✓</div>
        <h3>Thank you!</h3>
        <p>Your feedback has been sent successfully. We'll review it and get back to you if needed.</p>
        <button class="feedbacks-btn feedbacks-btn-primary">Close</button>
      </div>
    `;

    const closeBtn = modal.querySelector('button') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.close());
    
    // Auto-close after 4 seconds
    setTimeout(() => {
      if (this.isOpen) this.close();
    }, 4000);
  }

  private showInlineSuccess(container: HTMLElement): void {
    const widget = container.querySelector('.feedbacks-widget') as HTMLElement;
    
    // Store the original form HTML for later reset
    const originalHTML = this.getFormHTML(false);
    
    widget.innerHTML = `
      <div class="feedbacks-success">
        <div class="feedbacks-success-icon">✓</div>
        <h3>Thank you!</h3>
        <p>Your feedback has been sent successfully. We'll review it and get back to you if needed.</p>
      </div>
    `;
    
    // Reset form after 5 seconds
    setTimeout(() => {
      container.innerHTML = originalHTML;
      this.attachFormHandlers(container, false);
    }, 5000);
  }

  private showError(message: string): void {
    // Remove existing error
    const existingError = document.querySelector('.feedbacks-error');
    existingError?.remove();

    const content = document.querySelector('.feedbacks-content') as HTMLElement;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'feedbacks-error';
    errorDiv.innerHTML = `
      <span>⚠️</span>
      <span>${message}</span>
    `;
    
    content.insertBefore(errorDiv, content.firstChild);
    
    // Remove error after 5 seconds
    setTimeout(() => errorDiv?.remove(), 5000);
  }
}

// Auto-initialization
function initializeWidget(): void {
  const scripts = document.querySelectorAll('script[data-project]');
  
  scripts.forEach((script) => {
    const projectKey = script.getAttribute('data-project');
    
    if (projectKey) {
      const config: WidgetConfig = {
        projectKey,
        embedMode: (script.getAttribute('data-embed-mode') as any) || 'modal',
        target: script.getAttribute('data-target') || undefined,
        position: (script.getAttribute('data-position') as any) || 'bottom-right',
        buttonText: script.getAttribute('data-button-text') || undefined,
        primaryColor: script.getAttribute('data-color') || undefined,
        debug: script.hasAttribute('data-debug'),
        requireEmail: script.hasAttribute('data-require-email') || script.getAttribute('data-require-email') === 'true',
        requireCaptcha: script.hasAttribute('data-require-captcha') || script.getAttribute('data-require-captcha') === 'true',
        captchaProvider: (script.getAttribute('data-captcha-provider') as any) || undefined,
        turnstileSiteKey: script.getAttribute('data-turnstile-sitekey') || undefined,
        hcaptchaSiteKey: script.getAttribute('data-hcaptcha-sitekey') || undefined,
        enableType: !script.hasAttribute('data-enable-type') || script.getAttribute('data-enable-type') !== 'false',
        enableRating: !script.hasAttribute('data-enable-rating') || script.getAttribute('data-enable-rating') !== 'false',
        enableScreenshot: script.hasAttribute('data-enable-screenshot') || script.getAttribute('data-enable-screenshot') === 'true',
        screenshotRequired: script.hasAttribute('data-screenshot-required') || script.getAttribute('data-screenshot-required') === 'true',
        enablePriority: script.hasAttribute('data-enable-priority') || script.getAttribute('data-enable-priority') === 'true',
        enableTags: script.hasAttribute('data-enable-tags') || script.getAttribute('data-enable-tags') === 'true',
        successTitle: script.getAttribute('data-success-title') || undefined,
        successDescription: script.getAttribute('data-success-description') || undefined,
        enableAttachment: script.hasAttribute('data-enable-attachment') || script.getAttribute('data-enable-attachment') === 'true',
        attachmentMaxMB: script.getAttribute('data-attachment-maxmb') ? Number(script.getAttribute('data-attachment-maxmb')) : undefined,
      };
      
      new FeedbacksWidget(config);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
  initializeWidget();
}

// Export as default for webpack to handle UMD properly
export default FeedbacksWidget;
