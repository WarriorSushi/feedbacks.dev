import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from '@/components/image-lightbox';
import { ArrowLeft, Globe, Mail, MonitorSmartphone, Tag, Paperclip } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface PageProps { params: { id: string } }

export default async function FeedbackDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  // Fetch the feedback row; RLS ensures user owns the project
  const { data: row, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !row) redirect('/dashboard');

  // Fetch project name for header
  const { data: project } = await supabase
    .from('projects')
    .select('id,name')
    .eq('id', row.project_id)
    .single();

  const projectName = project?.name || 'Project';

  return (
    <div className="container mx-auto px-4 py-4 md:py-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Button variant="ghost" asChild className="gap-2 h-11 md:h-10">
          <Link href={`/projects/${row.project_id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Project</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base md:text-lg">
            <span>Feedback</span>
            <Badge variant={row.type === 'bug' ? 'destructive' : 'default'} className="text-xs">{row.type || 'general'}</Badge>
            {typeof row.rating === 'number' && (
              <Badge variant="outline" className="text-xs">Rating: {row.rating}/5</Badge>
            )}
          </CardTitle>
          <div className="text-xs md:text-sm text-muted-foreground">{projectName} • {formatDateTime(row.created_at)}</div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Message</div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{row.message}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-2 min-w-0"><Mail className="h-4 w-4 flex-shrink-0" /> <span className="truncate">{row.email || 'anonymous'}</span></div>
            <div className="flex items-center gap-2 min-w-0"><MonitorSmartphone className="h-4 w-4 flex-shrink-0" /> <span className="truncate" title={row.user_agent}>{row.user_agent || 'Unknown UA'}</span></div>
            <div className="flex items-center gap-2 min-w-0 sm:col-span-2"><Globe className="h-4 w-4 flex-shrink-0" /> <a href={row.url} target="_blank" rel="noreferrer" className="underline truncate">{row.url}</a></div>
            {row.priority && (<div className="flex items-center gap-2"><Tag className="h-4 w-4 flex-shrink-0" /> Priority: {row.priority}</div>)}
          </div>
          {Array.isArray(row.tags) && row.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {row.tags.map((t: string) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
            </div>
          )}
          {row.screenshot_url && (
            <div>
              <div className="text-sm font-medium mb-1">Screenshot</div>
              <ImageLightbox src={row.screenshot_url} className="max-h-[85vh] max-w-[95vw]" thumbClassName="w-full h-auto rounded border" />
            </div>
          )}
          {Array.isArray(row.attachments) && row.attachments.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-1">Attachments</div>
              <div className="flex flex-wrap gap-2">
                {row.attachments.map((att: any, idx: number) => (
                  att.type?.startsWith('image/') ? (
                    <ImageLightbox key={idx} src={att.url} thumbClassName="h-20 w-auto rounded border" />
                  ) : (
                    <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline">
                      <Paperclip className="h-3 w-3" /> {att.name || 'attachment'}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

