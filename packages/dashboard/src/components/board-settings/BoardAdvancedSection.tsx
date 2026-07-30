'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WorkspaceSection } from '@/components/ui/workspace-section'
import { Loader2 } from 'lucide-react'
import type { BoardReport } from '@/lib/types'

interface BoardAdvancedSettings {
  custom_css: string
}

interface BoardAdvancedSectionProps {
  settings: BoardAdvancedSettings
  onSettingsChange: (patch: Partial<BoardAdvancedSettings>) => void
  reports: BoardReport[]
  reportBusyId: string | null
  onReportStatusUpdate: (reportId: string, status: BoardReport['status']) => void
}

function formatReportTarget(report: BoardReport): string {
  return report.target_type === 'board'
    ? 'Board report'
    : `Post report${report.feedback_id ? ` \u2022 ${report.feedback_id.slice(0, 8)}` : ''}`
}

function formatReportDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function BoardAdvancedSection({
  settings,
  onSettingsChange,
  reports,
  reportBusyId,
  onReportStatusUpdate,
}: BoardAdvancedSectionProps) {
  return (
    <div className="space-y-6">
      <details className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer border-b bg-muted/25 px-5 py-4 text-base font-semibold">Custom CSS <span className="text-sm font-normal text-muted-foreground">· optional</span></summary>
        <div className="space-y-3 p-5 sm:p-6">
          <textarea
            value={settings.custom_css}
            onChange={(e) => onSettingsChange({ custom_css: e.target.value.slice(0, 6000) })}
            rows={6}
            className="min-h-[160px] w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
            placeholder=".feedbacks-board { --feedbacks-accent: #0f766e; }"
          />
          <p className="text-xs text-muted-foreground">
            Use this only if the color and logo settings are not enough.
          </p>
        </div>
      </details>

      <WorkspaceSection title="Reports" description="Check posts that visitors flag.">
          {reports.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              No reports yet. When someone flags the board or a post, it will show up here.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatReportTarget(report)}</p>
                    <p className="text-xs text-muted-foreground">{formatReportDate(report.created_at)}</p>
                  </div>
                  <Badge variant={report.status === 'open' ? 'secondary' : 'outline'}>{report.status}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{report.reason}</p>
                {report.details && <p className="mt-1 text-sm text-muted-foreground">{report.details}</p>}
                {report.reporter_email && (
                  <p className="mt-2 text-xs text-muted-foreground">Reporter: {report.reporter_email}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={report.status === 'reviewed' ? 'secondary' : 'outline'}
                    disabled={reportBusyId === report.id}
                    onClick={() => onReportStatusUpdate(report.id, 'reviewed')}
                  >
                    {reportBusyId === report.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                    Mark reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant={report.status === 'resolved' ? 'secondary' : 'outline'}
                    disabled={reportBusyId === report.id}
                    onClick={() => onReportStatusUpdate(report.id, 'resolved')}
                  >
                    Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant={report.status === 'dismissed' ? 'secondary' : 'outline'}
                    disabled={reportBusyId === report.id}
                    onClick={() => onReportStatusUpdate(report.id, 'dismissed')}
                  >
                    Dismiss
                  </Button>
                  {report.status !== 'open' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={reportBusyId === report.id}
                      onClick={() => onReportStatusUpdate(report.id, 'open')}
                    >
                      Re-open
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
      </WorkspaceSection>
    </div>
  )
}
