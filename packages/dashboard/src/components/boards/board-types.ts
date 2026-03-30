import type { BoardBranding } from '@/lib/public-board'

export interface BoardInfo {
  projectId: string
  title: string | null
  description: string | null
  slug: string
  allow_submissions: boolean
  show_types: string[]
  branding: BoardBranding
  customCss?: string | null
  displayName: string | null
}

export interface FeedbackItem {
  id: string
  message: string
  type: string | null
  status: string
  vote_count: number
  created_at: string
}

export interface AdminComment {
  id: string
  feedback_id: string
  content: string
  created_at: string
}

export interface BoardRecommendation {
  slug: string
  title: string
  description: string
  branding: BoardBranding
  feedbackCount: number
  trustScore: number
}

export interface BoardSuggestion {
  id: string
  title: string
  description: string
  status: string
  vote_count: number
}

export interface ReportTarget {
  type: 'board' | 'feedback'
  feedbackId?: string
}

export type SortMode = 'votes' | 'newest' | 'status'
export type FilterType = 'all' | 'idea' | 'bug' | 'praise' | 'question'

export const typeConfig: Record<string, { label: string; tone: string }> = {
  idea: { label: 'Feature request', tone: 'border-sky-200/80 bg-sky-50/80 text-sky-800' },
  bug: { label: 'Bug', tone: 'border-rose-200/80 bg-rose-50/80 text-rose-800' },
  praise: { label: 'Praise', tone: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-800' },
  question: { label: 'Question', tone: 'border-amber-200/80 bg-amber-50/80 text-amber-900' },
}

export const statusConfig: Record<string, { label: string; tone: string }> = {
  new: { label: 'New', tone: 'border-slate-200/80 bg-slate-100/80 text-slate-700' },
  reviewed: { label: 'Under review', tone: 'border-amber-200/80 bg-amber-100/80 text-amber-900' },
  planned: { label: 'Planned', tone: 'border-violet-200/80 bg-violet-100/80 text-violet-800' },
  in_progress: { label: 'In progress', tone: 'border-orange-200/80 bg-orange-100/80 text-orange-900' },
  closed: { label: 'Shipped', tone: 'border-emerald-200/80 bg-emerald-100/80 text-emerald-800' },
}

export function getTitle(message: string): string {
  const firstLine = message.split('\n')[0]
  return firstLine.length > 88 ? `${firstLine.slice(0, 88)}...` : firstLine
}

export function getDescription(message: string): string {
  const lines = message.split('\n')
  if (lines.length <= 1) return ''
  const rest = lines.slice(1).join(' ').trim()
  return rest.length > 180 ? `${rest.slice(0, 180)}...` : rest
}

export function getFullDescription(message: string): string {
  const lines = message.split('\n')
  if (lines.length <= 1) return ''
  return lines.slice(1).join('\n').trim()
}

export function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function readSetStorage(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

export function writeSetStorage(key: string, value: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...value]))
  } catch {
    // ignore
  }
}
