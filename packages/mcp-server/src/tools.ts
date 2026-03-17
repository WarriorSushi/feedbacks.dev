import { z } from 'zod'

export const submitFeedbackParams = z.object({
  message: z.string().min(2).describe('The feedback message'),
  type: z.enum(['bug', 'idea', 'praise', 'question']).default('bug').describe('Feedback type'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Priority level'),
  email: z.string().email().optional().describe('Contact email'),
  agent_name: z.string().optional().describe('Name of the AI agent submitting feedback'),
  agent_session_id: z.string().optional().describe('Session ID for grouping related feedback'),
  structured_data: z.object({
    stack_trace: z.string().optional(),
    error_code: z.string().optional(),
    reproduction_steps: z.array(z.string()).optional(),
    environment: z.record(z.string()).optional(),
    severity: z.string().optional(),
    component: z.string().optional(),
  }).passthrough().optional().describe('Structured data (stack traces, error codes, etc.)'),
})

export const listFeedbackParams = z.object({
  status: z.enum(['new', 'reviewed', 'planned', 'in_progress', 'closed']).optional().describe('Filter by status'),
  type: z.enum(['bug', 'idea', 'praise', 'question']).optional().describe('Filter by type'),
  limit: z.number().min(1).max(100).default(20).describe('Number of results'),
  page: z.number().min(1).default(1).describe('Page number'),
  search: z.string().optional().describe('Search keyword in messages'),
})

export const updateFeedbackStatusParams = z.object({
  feedback_id: z.string().describe('The feedback ID to update'),
  status: z.enum(['new', 'reviewed', 'planned', 'in_progress', 'closed']).describe('New status'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('New priority'),
  tags: z.array(z.string()).optional().describe('Tags to set'),
})

export const searchFeedbackParams = z.object({
  query: z.string().min(1).describe('Search keyword'),
  type: z.enum(['bug', 'idea', 'praise', 'question']).optional().describe('Filter by type'),
  status: z.enum(['new', 'reviewed', 'planned', 'in_progress', 'closed']).optional().describe('Filter by status'),
  limit: z.number().min(1).max(50).default(10).describe('Number of results'),
})
