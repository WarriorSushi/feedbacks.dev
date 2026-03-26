import { parseWidgetDataAttributes } from '@feedbacks/shared';
import FeedbacksWidget from './widget';

export type { WidgetConfig, FeedbackData, FeedbackResponse, CategoryType, EmbedMode, Position } from './types';
export { FeedbacksWidget };

// Auto-init from script data attributes
function autoInit(): void {
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-project]');

  scripts.forEach((script) => {
    if (script.hasAttribute('data-fb-initialized')) return;
    script.setAttribute('data-fb-initialized', 'true');

    const attr = (name: string) => script.getAttribute(name);
    const config = parseWidgetDataAttributes(
      {
        project: attr('data-project') || undefined,
        configVersion: attr('data-config-version') || undefined,
        embedMode: attr('data-embed-mode') || undefined,
        target: attr('data-target') || undefined,
        position: attr('data-position') || undefined,
        buttonText: attr('data-button-text') || undefined,
        color: attr('data-color') || undefined,
        bg: attr('data-bg') || undefined,
        scale: attr('data-scale') || undefined,
        modalWidth: attr('data-modal-width') || undefined,
        apiUrl: attr('data-api-url') || undefined,
        debug: attr('data-debug') || undefined,
        requireEmail: attr('data-require-email') || undefined,
        requireCaptcha: attr('data-require-captcha') || undefined,
        captchaProvider: attr('data-captcha-provider') || undefined,
        turnstileSiteKey: attr('data-turnstile-sitekey') || undefined,
        hcaptchaSiteKey: attr('data-hcaptcha-sitekey') || undefined,
        enableType: attr('data-enable-type') || undefined,
        enableRating: attr('data-enable-rating') || undefined,
        enableScreenshot: attr('data-enable-screenshot') || undefined,
        screenshotRequired: attr('data-screenshot-required') || undefined,
        enableAttachment: attr('data-enable-attachment') || undefined,
        attachmentMaxMB: attr('data-attachment-maxmb') || undefined,
        attachmentMimes: attr('data-attachment-mimes') || undefined,
        formTitle: attr('data-form-title') || undefined,
        formSubtitle: attr('data-form-subtitle') || undefined,
        messageLabel: attr('data-message-label') || undefined,
        messagePlaceholder: attr('data-message-placeholder') || undefined,
        emailLabel: attr('data-email-label') || undefined,
        submitText: attr('data-submit-text') || undefined,
        cancelText: attr('data-cancel-text') || undefined,
        successTitle: attr('data-success-title') || undefined,
        successDescription: attr('data-success-description') || undefined,
        openKey: attr('data-open-key') || undefined,
        openAfter: attr('data-open-after') || undefined,
      },
      {
        debug: script.hasAttribute('data-debug'),
        requireEmail: script.hasAttribute('data-require-email'),
        requireCaptcha: script.hasAttribute('data-require-captcha'),
        enableScreenshot: script.hasAttribute('data-enable-screenshot'),
        screenshotRequired: script.hasAttribute('data-screenshot-required'),
        enableAttachment: script.hasAttribute('data-enable-attachment'),
      },
    );
    if (!config) return;

    new FeedbacksWidget(config);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

// Make available globally for programmatic use
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).FeedbacksWidget = FeedbacksWidget;
}

export default FeedbacksWidget;
