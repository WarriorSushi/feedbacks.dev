import './styles.css';
import { FeedbackData, FeedbackResponse, WidgetConfig } from './types';

class FeedbacksWidget {
  private config: WidgetConfig;
  private isOpen = false;
  private button: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(config: WidgetConfig) {
    this.config = { position: 'bottom-right', ...config };
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
    this.createButton();
    this.attachEventListeners();
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
    this.button.innerHTML = '💬';
    this.button.title = this.config.buttonText || 'Send feedback';
    this.button.setAttribute('aria-label', 'Open feedback form');
    
    if (this.config.primaryColor) {
      this.button.style.background = this.config.primaryColor;
    }
    
    document.body.appendChild(this.button);
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
    
    modal.innerHTML = `
      <div class="feedbacks-widget">
        <div class="feedbacks-header">
          <h3 id="feedbacks-title" class="feedbacks-title">Send Feedback</h3>
          <p class="feedbacks-subtitle">Help us improve by sharing your thoughts</p>
          <button type="button" class="feedbacks-close" aria-label="Close feedback form">
            ✕
          </button>
        </div>
        <div class="feedbacks-content">
          <form class="feedbacks-form">
            <div class="feedbacks-field">
              <label for="feedbacks-message" class="feedbacks-label">Your feedback *</label>
              <textarea
                id="feedbacks-message"
                class="feedbacks-textarea"
                placeholder="What's on your mind? Any bugs, suggestions, or general feedback..."
                required
                maxlength="2000"
              ></textarea>
              <div class="feedbacks-char-count">0/2000</div>
            </div>
            <div class="feedbacks-field">
              <label for="feedbacks-email" class="feedbacks-label">Email (optional)</label>
              <input
                id="feedbacks-email"
                type="email"
                class="feedbacks-input"
                placeholder="your@email.com"
              />
            </div>
            <div class="feedbacks-actions">
              <button type="button" class="feedbacks-btn feedbacks-btn-secondary">Cancel</button>
              <button type="submit" class="feedbacks-btn feedbacks-btn-primary">
                Send Feedback
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);

    // Focus management
    const textarea = modal.querySelector('#feedbacks-message') as HTMLTextAreaElement;
    setTimeout(() => textarea?.focus(), 100);

    // Attach handlers
    this.attachFormHandlers(modal);
  }

  private attachFormHandlers(modal: HTMLElement): void {
    const form = modal.querySelector('form') as HTMLFormElement;
    const textarea = modal.querySelector('#feedbacks-message') as HTMLTextAreaElement;
    const emailInput = modal.querySelector('#feedbacks-email') as HTMLInputElement;
    const cancelBtn = modal.querySelector('.feedbacks-btn-secondary') as HTMLButtonElement;
    const closeBtn = modal.querySelector('.feedbacks-close') as HTMLButtonElement;
    const submitBtn = modal.querySelector('.feedbacks-btn-primary') as HTMLButtonElement;
    const charCount = modal.querySelector('.feedbacks-char-count') as HTMLElement;

    // Character counter
    textarea.addEventListener('input', () => {
      const count = textarea.value.length;
      charCount.textContent = `${count}/2000`;
      charCount.style.color = count > 1900 ? '#dc2626' : '#9ca3af';
    });

    // Close handlers
    cancelBtn.addEventListener('click', () => this.close());
    closeBtn.addEventListener('click', () => this.close());

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
        });
        
        this.showSuccess();
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
      const response = await fetch('https://app.feedbacks.dev/api/feedback', {
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
    
    if (projectKey && script.getAttribute('src')?.includes('feedbacks.dev')) {
      const config: WidgetConfig = {
        projectKey,
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

// Export for manual initialization
(window as any).FeedbacksWidget = FeedbacksWidget;