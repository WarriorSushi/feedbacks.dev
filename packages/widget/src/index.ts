import FeedbacksWidget from './widget';
import type { WidgetConfig } from './types';

export type { WidgetConfig, FeedbackData, FeedbackResponse, CategoryType, EmbedMode, Position } from './types';
export { FeedbacksWidget };

// Auto-init from script data attributes
function autoInit(): void {
  const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-project]');

  scripts.forEach((script) => {
    const projectKey = script.getAttribute('data-project');
    if (!projectKey) return;

    const attr = (name: string) => script.getAttribute(name);
    const boolAttr = (name: string) => attr(name) === 'true' || (script.hasAttribute(name) && attr(name) !== 'false');
    const numAttr = (name: string) => { const v = attr(name); return v ? Number(v) : undefined; };

    const config: WidgetConfig = {
      projectKey,
      embedMode: (attr('data-embed-mode') as WidgetConfig['embedMode']) || 'modal',
      target: attr('data-target') || undefined,
      position: (attr('data-position') as WidgetConfig['position']) || 'bottom-right',
      buttonText: attr('data-button-text') || undefined,
      primaryColor: attr('data-color') || undefined,
      backgroundColor: attr('data-bg') || undefined,
      scale: numAttr('data-scale'),
      modalWidth: numAttr('data-modal-width'),
      apiUrl: attr('data-api-url') || undefined,
      debug: boolAttr('data-debug'),
      requireEmail: boolAttr('data-require-email'),
      requireCaptcha: boolAttr('data-require-captcha'),
      captchaProvider: (attr('data-captcha-provider') as WidgetConfig['captchaProvider']) || undefined,
      turnstileSiteKey: attr('data-turnstile-sitekey') || undefined,
      hcaptchaSiteKey: attr('data-hcaptcha-sitekey') || undefined,
      enableType: attr('data-enable-type') !== 'false',
      enableRating: attr('data-enable-rating') !== 'false',
      enableScreenshot: boolAttr('data-enable-screenshot'),
      enableAttachment: boolAttr('data-enable-attachment'),
      attachmentMaxMB: numAttr('data-attachment-maxmb'),
      formTitle: attr('data-form-title') || undefined,
      formSubtitle: attr('data-form-subtitle') || undefined,
      submitButtonText: attr('data-submit-text') || undefined,
      successTitle: attr('data-success-title') || undefined,
      successDescription: attr('data-success-description') || undefined,
      openOnKey: attr('data-open-key') || undefined,
      openAfterMs: numAttr('data-open-after'),
    };

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
