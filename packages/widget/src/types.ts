export interface FeedbackData {
  apiKey: string;
  message: string;
  email?: string;
  url: string;
  userAgent: string;
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
  debug?: boolean;
}