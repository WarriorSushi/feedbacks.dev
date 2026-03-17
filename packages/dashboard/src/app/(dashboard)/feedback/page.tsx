'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  truncate,
  formatRelativeTime,
  getTypeIcon,
  getStatusColor,
  getTypeColor,
} from '@/lib/utils'
import type { Feedback, FeedbackStatus, FeedbackType } from '@/lib/types'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 20

const statuses: FeedbackStatus[] = ['new', 'reviewed', 'planned', 'in_progress', 'closed']
const types: FeedbackType[] = ['bug', 'idea', 'praise', 'question']

export default function FeedbackInboxPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = React.useMemo(() => createClient(), [])

  const [feedbacks, setFeedbacks] = React.useState<Feedback[]>([])
  const [loading, setLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const page = Number(searchParams.get('page') || '1')
  const status = searchParams.get('status') || ''
  const type = searchParams.get('type') || ''
  const search = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = React.useState(search)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchFeedback = React.useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('feedbacks')
      .select('*, projects(id, name)', { count: 'exact' })
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    if (search) query = query.ilike('message', `%${search}%`)

    const { data, count } = await query
    setFeedbacks((data as Feedback[]) || [])
    setTotal(count || 0)
    setSelected(new Set())
    setLoading(false)
  }, [supabase, page, status, type, search])

  React.useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    if (updates.page === undefined) params.set('page', '1')
    router.push(`/feedback?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ q: searchInput })
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === feedbacks.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(feedbacks.map((f) => f.id)))
    }
  }

  const bulkUpdateStatus = async (newStatus: FeedbackStatus) => {
    if (selected.size === 0) return
    await supabase
      .from('feedbacks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in('id', Array.from(selected))
    fetchFeedback()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feedback</h1>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 w-48"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>

        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={type}
          onChange={(e) => updateParams({ type: e.target.value })}
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {getTypeIcon(t)} {t}
            </option>
          ))}
        </select>

        {(status || type || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateParams({ status: '', type: '', q: '' })}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-sm">
          <span>{selected.size} selected</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkUpdateStatus('reviewed')}
          >
            <CheckCircle className="mr-1 h-3 w-3" /> Mark Reviewed
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => bulkUpdateStatus('closed')}
          >
            <XCircle className="mr-1 h-3 w-3" /> Close
          </Button>
        </div>
      )}

      {/* List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No feedback found.
          </div>
        ) : (
          <div>
            {/* Select all */}
            <div className="flex items-center gap-3 border-b px-4 py-2">
              <input
                type="checkbox"
                checked={selected.size === feedbacks.length && feedbacks.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border"
              />
              <span className="text-xs text-muted-foreground">Select all</span>
            </div>

            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(fb.id)}
                  onChange={() => toggleSelect(fb.id)}
                  className="mt-1 h-4 w-4 rounded border"
                />
                <Link
                  href={`/feedback/${fb.id}`}
                  className="flex min-w-0 flex-1 items-start gap-3"
                >
                  <span className="mt-0.5 text-lg">{getTypeIcon(fb.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{truncate(fb.message, 100)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={getStatusColor(fb.status)}
                      >
                        {fb.status.replace('_', ' ')}
                      </Badge>
                      {fb.type && (
                        <Badge variant="secondary" className={getTypeColor(fb.type)}>
                          {fb.type}
                        </Badge>
                      )}
                      {fb.projects && (
                        <span className="text-xs text-muted-foreground">
                          {fb.projects.name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(fb.created_at)}
                      </span>
                    </div>
                  </div>
                  {fb.rating && (
                    <div className="flex items-center gap-0.5 text-sm text-yellow-500">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < fb.rating! ? 'fill-current' : 'opacity-30'}`}
                        />
                      ))}
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
