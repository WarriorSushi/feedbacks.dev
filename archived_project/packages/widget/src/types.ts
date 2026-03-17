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
  backgroundColor?: string; // form/modal background
  scale?: number; // overall scale (e.g., 0.8–1.4)
  // Ultra customization
  headerIcon?: 'none' | 'chat' | 'star' | 'lightbulb' | 'thumbs-up';
  headerLayout?: 'text-only' | 'icon-left' | 'icon-top';
  spacing?: number; // base spacing in px (e.g., 16–32)
  modalWidth?: number; // max-width for modal on desktop (px)
  inlineBorder?: string; // e.g., '0 solid transparent' | '1px solid #e5e7eb'
  inlineShadow?: string; // e.g., 'none' | '0 8px 24px rgba(0,0,0,0.12)'
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
  // Form text customization
  formTitle?: string; // Default: "Send Feedback"
  formSubtitle?: string; // Default: "Help us improve by sharing your thoughts"
  messageLabel?: string; // Default: "Your feedback *"
  messagePlaceholder?: string; // Default: "What's on your mind? Any bugs, suggestions, or general feedback..."
  emailLabel?: string; // Default: "Email (optional)"
  submitButtonText?: string; // Default: "Send Feedback"
  cancelButtonText?: string; // Default: "Cancel"
  openOnKey?: string; // e.g., 'Shift+F'
  openAfterMs?: number; // open automatically after N ms (modal)
}
