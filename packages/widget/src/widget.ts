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

  constructor(config: WidgetConfig) {
    this.config = { position: 'bottom-right', embedMode: 'modal', ...config };
    this.init();
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

  private log(message: string): void {
    if (this.config.debug) {
      console.log('[Feedbacks Widget]', message);
    }
  }

  private createButton(): void {
    this.button = document.createElement('button');
    this.button.className = `feedbacks-button position-${this.config.position}`;
    this.button.innerHTML = this.config.buttonText || 'Feedback';
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
            <div class=\"feedbacks-field\">
              <label for=\"feedbacks-type${idSuffix}\" class=\"feedbacks-label\">Category (optional)</label>
              <select id=\"feedbacks-type${idSuffix}\" class=\"feedbacks-input\">
                <option value=\"\">Select a category</option>
                <option value=\"bug\">Bug</option>
                <option value=\"idea\">Idea</option>
                <option value=\"praise\">Praise</option>
              </select>
            </div>
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
            </div>
            <div class="feedbacks-field">
              <label for="feedbacks-email${idSuffix}" class="feedbacks-label">Email (optional)</label>
              <input
                id="feedbacks-email${idSuffix}"
                type="email"
                class="feedbacks-input"
                placeholder="your@email.com"
              />
            </div>
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

    // Attach handlers
    this.attachFormHandlers(modal, true);
  }

  private attachFormHandlers(container: HTMLElement, isModal = true): void {
    const idSuffix = isModal ? '-modal' : '-inline';
    const form = container.querySelector('form') as HTMLFormElement;
    const textarea = container.querySelector(`#feedbacks-message${idSuffix}`) as HTMLTextAreaElement;
    const emailInput = container.querySelector(`#feedbacks-email${idSuffix}`) as HTMLInputElement;
    const typeSelect = container.querySelector(`#feedbacks-type${idSuffix}`) as HTMLSelectElement | null;
    const ratingSelect = container.querySelector(`#feedbacks-rating${idSuffix}`) as HTMLSelectElement | null;
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

      if (email && !this.isValidEmail(email)) {
        this.showError('Please enter a valid email address');
        return;
      }

      this.setSubmitState(submitBtn, true);

      try {
        await this.submitFeedback({
          apiKey: this.config.projectKey,
          message,
          email: email || undefined,
          url: window.location.href,
          userAgent: navigator.userAgent,
          type: typeSelect && typeSelect.value ? typeSelect.value : undefined,
          rating: ratingSelect && ratingSelect.value ? parseInt(ratingSelect.value, 10) : undefined,
        });
        
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

  private async submitFeedback(data: FeedbackData): Promise<FeedbackResponse> {
    return this.submitWithRetry(data);
  }

  private async submitWithRetry(data: FeedbackData, attempt = 1): Promise<FeedbackResponse> {
    try {
      const apiUrl = this.config.apiUrl || 'https://app.feedbacks.dev/api/feedback';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

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

// Export for manual initialization (do this immediately)
(window as any).FeedbacksWidget = FeedbacksWidget;

// Also export as a module
export default FeedbacksWidget;
