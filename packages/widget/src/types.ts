export interface FeedbackData {
  apiKey: string;
  message: string;
  email?: string;
  url: string;
  userAgent: string;
  type?: 'bug' | 'idea' | 'praise';
  rating?: number;
  screenshot?: string; // data URL (png)
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  turnstileToken?: string;
  hcaptchaToken?: string;
}

export interface FeedbackResponse {
  id: string;
  success: boolean;
  error?: string;
}

export interface WidgetConfig {
  projectKey: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  embedMode?: 'modal' | 'inline' | 'trigger';
  target?: string; // CSS selector for embed target
  buttonText?: string;
  primaryColor?: string;
  apiUrl?: string; // Custom API endpoint
  debug?: boolean;
  requireEmail?: boolean;
  requireCaptcha?: boolean;
  captchaProvider?: 'turnstile' | 'hcaptcha';
  turnstileSiteKey?: string;
  hcaptchaSiteKey?: string;
  enableType?: boolean;
  enableRating?: boolean;
  enableScreenshot?: boolean;
  screenshotRequired?: boolean;
  enablePriority?: boolean;
  enableTags?: boolean;
  enableAttachment?: boolean;
  attachmentMaxMB?: number; // default 5
  allowedAttachmentMimes?: string[]; // default [png,jpeg,pdf]
  successTitle?: string;
  successDescription?: string;
  openOnKey?: string; // e.g., 'Shift+F'
  openAfterMs?: number; // open automatically after N ms (modal)
}
