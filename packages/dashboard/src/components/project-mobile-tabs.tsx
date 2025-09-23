"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { RefreshButton } from '@/components/refresh-button';
import { ProjectSettingsLauncher } from '@/components/project-settings-launcher';
import { cn } from '@/lib/utils';
import type { WidgetStep } from '@/components/widget-installation';
import { useWidgetStepContext } from '@/components/widget-installation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type ProjectSection = 'widget-installation' | 'feedback' | 'analytics' | 'integrations';

interface ProjectMobileTabsProps {
  projectId: string;
  projectName: string;
  activeSection: ProjectSection;
  widgetStep?: WidgetStep;
}

const SECTION_TABS: Array<{ id: ProjectSection; label: string }> = [
  { id: 'widget-installation', label: 'Widget' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'integrations', label: 'Integrations' },
];

const SECTION_LABEL: Record<ProjectSection, string> = {
  'widget-installation': 'Widget',
  feedback: 'Feedback',
  analytics: 'Analytics',
  integrations: 'Integrations',
};

const WIDGET_SUB_STEPS: Array<{ id: WidgetStep; label: string }> = [
  { id: 'setup', label: 'Setup' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'fields', label: 'Fields' },
  { id: 'protection', label: 'Protection' },
  { id: 'publish', label: 'Publish' },
];

export function ProjectMobileTabs({ projectId, projectName, activeSection, widgetStep: widgetStepProp }: ProjectMobileTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const widgetStepContext = useWidgetStepContext();
  const widgetStep = widgetStepContext?.step ?? widgetStepProp ?? 'setup';

  const rawWidgetIndex = WIDGET_SUB_STEPS.findIndex((step) => step.id === widgetStep);
  const activeWidgetIndex = rawWidgetIndex >= 0 ? rawWidgetIndex : 0;

  const handleSectionChange = (section: ProjectSection) => {
    if (section === activeSection) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);

    if (section !== 'feedback') {
      params.delete('type');
      params.delete('rating');
      params.delete('page');
    }

    if (section === 'widget-installation') {
      if (!params.get('widgetStep')) {
        params.set('widgetStep', 'setup');
      }
    } else {
      params.delete('widgetStep');
    }

    router.push(pathname + '?' + params.toString());
  };

  const handleWidgetStepChange = (step: WidgetStep) => {
    if (step === widgetStep) {
      return;
    }
    if (widgetStepContext) {
      widgetStepContext.setStep(step);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'widget-installation');
    params.set('widgetStep', step);
    router.push(pathname + '?' + params.toString());
  };

  return (

    <div className="lg:hidden sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="px-3 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="h-9 min-w-0 flex-1 justify-start gap-2 rounded-md border border-border/70 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <RefreshButton className="h-9 w-9 rounded-md border border-border/70 bg-background/80 p-0" />

            <ProjectSettingsLauncher
              projectId={projectId}
              projectName={projectName}
              variant="icon"

              className="h-9 w-9 rounded-md border border-border/70 bg-background/80"

            />
          </div>
        </div>


        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground/80">Project</p>
            <p className="truncate text-base font-semibold leading-tight text-foreground">{projectName}</p>
          </div>
          <Badge variant="outline" className="border-border/70 text-[10px] font-semibold uppercase tracking-[0.32em]">
            {SECTION_LABEL[activeSection]}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1">

          {SECTION_TABS.map((tab) => {
            const isActive = tab.id === activeSection;
            return (
              <Button
                key={tab.id}
                type="button"

                variant="ghost"
                onClick={() => handleSectionChange(tab.id)}
                className={cn(
                  'relative h-[34px] min-w-0 justify-center rounded-md border px-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-all duration-150',
                  isActive
                    ? 'border-foreground bg-foreground text-background shadow-sm'
                    : 'border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted/70'

                )}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>


        {activeSection === 'widget-installation' && (
          <div className="mt-4">
            <div className="rounded-2xl border border-primary/35 bg-primary/10 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-primary/80">
                  Widget steps
                </span>
                <Badge
                  variant="outline"
                  className="border-primary/40 bg-primary/15 text-[9px] font-semibold uppercase tracking-[0.26em] text-primary"
                >
                  {activeWidgetIndex + 1}/{WIDGET_SUB_STEPS.length}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1">
                {WIDGET_SUB_STEPS.map((step, index) => {
                  const isStepActive = step.id === widgetStep;
                  return (
                    <Button
                      key={step.id}
                      type="button"
                      onClick={() => handleWidgetStepChange(step.id)}
                      variant="ghost"
                      className={cn(
                        'h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-0.5 text-[9px] font-medium tracking-[0.06em] transition-colors',
                        isStepActive
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-primary/30 text-primary hover:bg-primary/10'
                      )}
                    >
                      <span className="text-[11px] font-semibold leading-none">{index + 1}</span>
                      <span className="truncate text-[8px] font-medium leading-tight">
                        {step.label.toLowerCase()}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
