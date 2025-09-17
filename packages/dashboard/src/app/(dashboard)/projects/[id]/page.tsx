import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { WidgetInstallationExperience, type WidgetStep } from '@/components/widget-installation';
import { ArrowLeft, ExternalLink, MessageSquare, Globe, Mail, MonitorSmartphone, Tag, Paperclip, BarChart3, Webhook } from 'lucide-react';
import { ProjectSettingsLauncher } from '@/components/project-settings-launcher';
import { RefreshButton } from '@/components/refresh-button';
import { ProjectAnalytics } from '@/components/project-analytics';
import { ImageLightbox } from '@/components/image-lightbox';
import { ProjectIntegrations } from '@/components/project-integrations';
import { ArchiveFeedbackButton } from '@/components/archive-feedback-button';
import { ProjectMobileTabs } from '@/components/project-mobile-tabs';

type ProjectSection = 'widget-installation' | 'feedback' | 'analytics' | 'integrations';

interface ProjectPageProps {
  params: { id: string };
  searchParams?: { page?: string; type?: string; rating?: string; section?: string; widgetStep?: string };
}

const PROJECT_SECTIONS = new Set<ProjectSection>([
  'widget-installation',
  'feedback',
  'analytics',
  'integrations',
]);

const SECTION_LABEL: Record<ProjectSection, string> = {
  'widget-installation': 'Widget Installation',
  feedback: 'Feedback',
  analytics: 'Analytics',
  integrations: 'Integrations',
};

const WIDGET_STEPS: WidgetStep[] = ['setup', 'appearance', 'fields', 'protection', 'publish'];

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('owner_user_id', user.id)
    .single();

  if (error || !project) {
    redirect('/dashboard');
  }

  const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const typeFilter = (searchParams?.type || '').toLowerCase();
  const ratingFilter = searchParams?.rating ? parseInt(searchParams.rating, 10) : undefined;

  let query = supabase
    .from('feedback')
    .select('*', { count: 'exact' })
    .eq('project_id', params.id)
    .order('created_at', { ascending: false });

  if (['bug', 'idea', 'praise'].includes(typeFilter)) {
    query = query.eq('type', typeFilter);
  }
  if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
    query = query.eq('rating', ratingFilter);
  }

  const { data: feedbacks, count } = await query.range(from, to);

  const WIDGET_VERSION = 'latest';
  const defaultSection: ProjectSection = typeof count === 'number' && count > 0 ? 'feedback' : 'widget-installation';
  const requestedSection = (searchParams?.section || '').toLowerCase();
  const activeSection = PROJECT_SECTIONS.has(requestedSection as ProjectSection)
    ? (requestedSection as ProjectSection)
    : defaultSection;

  const widgetStepParam = (searchParams?.widgetStep || '').toLowerCase();
  const activeWidgetStep: WidgetStep = WIDGET_STEPS.includes(widgetStepParam as WidgetStep)
    ? (widgetStepParam as WidgetStep)
    : WIDGET_STEPS[0];

  const baseFeedbackParams = new URLSearchParams();
  baseFeedbackParams.set('section', 'feedback');
  if (typeFilter) {
    baseFeedbackParams.set('type', typeFilter);
  }
  if (typeof ratingFilter === 'number') {
    baseFeedbackParams.set('rating', String(ratingFilter));
  }

  const previousParams = new URLSearchParams(baseFeedbackParams);
  previousParams.set('page', String(Math.max(1, page - 1)));

  const nextParams = new URLSearchParams(baseFeedbackParams);
  nextParams.set('page', String(page + 1));

  const sectionBadge = SECTION_LABEL[activeSection];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 py-6">
        <ProjectMobileTabs
          projectId={project.id}
          projectName={project.name}
          activeSection={activeSection}
          widgetStep={activeWidgetStep}
        />
        <div className="mb-6 hidden flex-col gap-3 lg:flex lg:flex-row lg:items-center lg:justify-between">
          <Button variant="ghost" asChild className="w-full justify-start gap-2 sm:w-auto">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <RefreshButton className="w-full sm:w-auto" />
            <ProjectSettingsLauncher
              projectId={project.id}
              projectName={project.name}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <div>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Manage your feedback collection
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <Badge variant="secondary" className="px-2 py-1">
              Project ID: {String(project.id).slice(0, 6)}…
            </Badge>
            <Badge variant="outline" className="px-2 py-1">
              Created {new Date(project.created_at).toLocaleDateString()}
            </Badge>
            <Badge variant="outline" className="px-2 py-1 text-[11px] sm:text-xs">
              {sectionBadge}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {activeSection === 'widget-installation' && (
            <WidgetInstallationExperience
              key={project.id + '-' + activeWidgetStep}
              projectId={params.id}
              projectKey={project.api_key}
              projectName={project.name}
              widgetVersion={WIDGET_VERSION}
              initialStep={activeWidgetStep}
            />
          )}

          {activeSection === 'feedback' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Recent Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    {feedbacks && feedbacks.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {feedbacks.slice(0, 5).map((fb) => (
                          <details key={fb.id} className="group rounded-lg border p-3 sm:p-4">
                            <summary className="list-none cursor-pointer outline-none">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="mb-2 flex items-center gap-2">
                                    <Badge variant={fb.type === 'bug' ? 'destructive' : 'default'}>
                                      {fb.type || 'general'}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(fb.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="line-clamp-2 text-foreground">{fb.message}</p>
                                  {fb.email && (
                                    <p className="mt-1 text-sm text-muted-foreground">From: {fb.email}</p>
                                  )}
                                  {typeof fb.rating === 'number' && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      Rating: {fb.rating}/5
                                    </p>
                                  )}
                                </div>
                              </div>
                            </summary>
                            <div className="mt-3 space-y-3">
                              {fb.screenshot_url && (
                                <ImageLightbox
                                  src={fb.screenshot_url}
                                  className="max-h-[85vh] max-w-[95vw]"
                                  thumbClassName="h-auto w-full rounded border"
                                />
                              )}
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  <span>{fb.email || 'anonymous'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Globe className="h-4 w-4" />
                                  <a href={fb.url} target="_blank" rel="noreferrer" className="truncate underline">
                                    {fb.url}
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MonitorSmartphone className="h-4 w-4" />
                                  <span className="truncate" title={(fb as any).user_agent}>
                                    {(fb as any).user_agent || 'Unknown UA'}
                                  </span>
                                </div>
                                {fb.priority && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Tag className="h-4 w-4" />
                                    <span>Priority: {fb.priority}</span>
                                  </div>
                                )}
                                {Array.isArray((fb as any).tags) && (fb as any).tags.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {(fb as any).tags.map((t: string) => (
                                      <Badge key={t} variant="outline" className="text-xs">
                                        {t}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <div className="text-muted-foreground">
                                  Created: {new Date(fb.created_at).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <ArchiveFeedbackButton id={fb.id} />
                              </div>
                              <div>
                                <div className="mb-1 text-sm font-medium">Message</div>
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                  {fb.message}
                                </p>
                              </div>
                              {Array.isArray((fb as any).attachments) && (fb as any).attachments.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Attachments</div>
                                  <div className="flex flex-wrap gap-2">
                                    {(fb as any).attachments.map((att: any, idx: number) => (
                                      att.type?.startsWith('image/') ? (
                                        <ImageLightbox
                                          key={idx}
                                          src={att.url}
                                          thumbClassName="h-20 w-auto rounded border"
                                        />
                                      ) : (
                                        <a
                                          key={idx}
                                          href={att.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-sm underline"
                                        >
                                          <Paperclip className="h-3 w-3" /> {att.name || 'attachment.pdf'}
                                        </a>
                                      )
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <p>No feedback yet.</p>
                        <p className="mt-1 text-sm">Install the widget to start collecting feedback!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                  <div className="space-x-2">
                    <Link
                      href={'/projects/' + params.id + '?' + previousParams.toString()}
                      className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                      aria-disabled={page <= 1}
                    >
                      Previous
                    </Link>
                    <Link
                      href={'/projects/' + params.id + '?' + nextParams.toString()}
                      className="rounded border px-3 py-1 text-sm"
                    >
                      Next
                    </Link>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Page {page}
                    {typeof count === 'number'
                      ? ' of ' + Math.max(1, Math.ceil(count / pageSize))
                      : ''}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle>Project Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    <div className="space-y-4">
                      <div>
                        <Label>Total Feedback</Label>
                        <p className="text-2xl font-bold text-blue-600">{feedbacks?.length || 0}</p>
                      </div>
                      <div>
                        <Label>Project ID</Label>
                        <p className="text-sm font-mono text-muted-foreground">{project.id}</p>
                      </div>
                      <div>
                        <Label>Created</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 pt-0 sm:p-6 sm:pt-0">
                    <Button variant="outline" className="w-full justify-start gap-2 text-xs sm:text-sm">
                      <ExternalLink className="h-4 w-4" />
                      View All Feedback
                    </Button>
                    <ProjectSettingsLauncher
                      projectId={project.id}
                      projectName={project.name}
                      className="w-full justify-start text-xs sm:text-sm"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'analytics' && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Summary (last 7 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <ProjectAnalytics projectId={params.id} />
              </CardContent>
            </Card>
          )}

          {activeSection === 'integrations' && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <ProjectIntegrations projectId={params.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
