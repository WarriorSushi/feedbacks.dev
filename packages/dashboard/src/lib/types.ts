export interface Project {
  id: string;
  name: string;
  api_key: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  project_id: string;
  message: string;
  email?: string;
  url: string;
  user_agent: string;
  is_read: boolean;
  created_at: string;
  projects?: Project;
}

export interface FeedbackRequest {
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

export interface PaginatedFeedback {
  data: Feedback[];
  count: number;
  page: number;
  totalPages: number;
}