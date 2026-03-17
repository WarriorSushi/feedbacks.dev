export interface FeedbackData {
  apiKey: string;
  message: string;
  email?: string;
  url: string;
  userAgent: string;
  type?: 'bug' | 'idea' | 'praise' | 'question';
  rating?: number;
  screenshot?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  turnstileToken?: string;
  hcaptchaToken?: string;
}

export interface FeedbackResponse {
  id: string;
  success: boolean;
  error?: string;
}

export type EmbedMode = 'modal' | 'inline' | 'trigger';
export type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type CaptchaProvider = 'turnstile' | 'hcaptcha';
export type CategoryType = 'bug' | 'idea' | 'praise' | 'question';

export interface WidgetConfig {
  projectKey: string;
  position?: Position;
  embedMode?: EmbedMode;
  target?: string;
  buttonText?: string;
  primaryColor?: string;
  backgroundColor?: string;
  scale?: number;
  modalWidth?: number;
  apiUrl?: string;
  debug?: boolean;

  // Field toggles
  requireEmail?: boolean;
  enableType?: boolean;
  enableRating?: boolean;
  enableScreenshot?: boolean;
  screenshotRequired?: boolean;
  enableAttachment?: boolean;
  attachmentMaxMB?: number;
  allowedAttachmentMimes?: string[];

  // Anti-spam
  requireCaptcha?: boolean;
  captchaProvider?: CaptchaProvider;
  turnstileSiteKey?: string;
  hcaptchaSiteKey?: string;

  // Text customization
  formTitle?: string;
  formSubtitle?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  emailLabel?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  successTitle?: string;
  successDescription?: string;

  // Behavior
  openOnKey?: string;
  openAfterMs?: number;
}
