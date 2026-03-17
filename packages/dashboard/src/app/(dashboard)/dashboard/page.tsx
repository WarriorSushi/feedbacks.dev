import { createServerSupabase } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, truncate, getTypeIcon, getStatusColor } from '@/lib/utils'
import type { Feedback } from '@/lib/types'
import Link from 'next/link'
import { MessageSquare, Star, FolderOpen, Bell } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch stats
  const { count: totalCount } = await supabase
    .from('feedbacks')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)

  const { count: newCount } = await supabase
    .from('feedbacks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')
    .eq('is_archived', false)

  const { data: ratingData } = await supabase
    .from('feedbacks')
    .select('rating')
    .not('rating', 'is', null)
    .eq('is_archived', false)

  const avgRating =
    ratingData && ratingData.length > 0
      ? ratingData.reduce((sum, f) => sum + (f.rating || 0), 0) / ratingData.length
      : null

  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('owner_user_id', user!.id)

  // Recent feedback
  const { data: recentFeedback } = await supabase
    .from('feedbacks')
    .select('*, projects(id, name)')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(10)

  // Type distribution
  const { data: typeDist } = await supabase
    .from('feedbacks')
    .select('type')
    .eq('is_archived', false)

  const typeCounts = { bug: 0, idea: 0, praise: 0, question: 0, other: 0 }
  typeDist?.forEach((f) => {
    const t = f.type as string
    if (t in typeCounts) {
      typeCounts[t as keyof typeof typeCounts]++
    } else {
      typeCounts.other++
    }
  })

  const stats = [
    { label: 'Total Feedback', value: totalCount || 0, icon: MessageSquare },
    { label: 'New (Unread)', value: newCount || 0, icon: Bell },
    { label: 'Avg Rating', value: avgRating ? avgRating.toFixed(1) : 'N/A', icon: Star },
    { label: 'Active Projects', value: projectCount || 0, icon: FolderOpen },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Feedback */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentFeedback || recentFeedback.length === 0 ? (
              <p className="text-sm text-muted-foreground">No feedback yet.</p>
            ) : (
              <div className="space-y-3">
                {(recentFeedback as Feedback[]).map((fb) => (
                  <Link
                    key={fb.id}
                    href={`/feedback/${fb.id}`}
                    className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-accent"
                  >
                    <span className="mt-0.5 text-lg">{getTypeIcon(fb.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{truncate(fb.message, 80)}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={getStatusColor(fb.status)}
                        >
                          {fb.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(fb.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(typeCounts)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const total = totalCount || 1
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={type}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>
                          {getTypeIcon(type)} {type}
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              {totalCount === 0 && (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feedback Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackTrendChart />
        </CardContent>
      </Card>
    </div>
  )
}

async function FeedbackTrendChart() {
  const supabase = await createServerSupabase()

  // Last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const { data } = await supabase
    .from('feedbacks')
    .select('created_at')
    .gte('created_at', days[0] + 'T00:00:00')
    .eq('is_archived', false)

  const countByDay = new Map<string, number>()
  days.forEach((d) => countByDay.set(d, 0))
  data?.forEach((f) => {
    const day = f.created_at.split('T')[0]
    countByDay.set(day, (countByDay.get(day) || 0) + 1)
  })

  const maxCount = Math.max(...Array.from(countByDay.values()), 1)

  return (
    <div className="flex items-end gap-2" style={{ height: 120 }}>
      {days.map((day) => {
        const count = countByDay.get(day) || 0
        const height = Math.max((count / maxCount) * 100, 4)
        return (
          <div key={day} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{count}</span>
            <div
              className="w-full rounded-t bg-primary transition-all"
              style={{ height: `${height}%` }}
            />
            <span className="text-[10px] text-muted-foreground">
              {new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
