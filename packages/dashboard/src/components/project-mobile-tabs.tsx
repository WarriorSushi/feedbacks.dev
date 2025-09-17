"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { RefreshButton } from '@/components/refresh-button';
import { ProjectSettingsLauncher } from '@/components/project-settings-launcher';
import { cn } from '@/lib/utils';
import type { WidgetStep } from '@/components/widget-installation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type ProjectSection = 'widget-installation' | 'feedback' | 'analytics' | 'integrations';

interface ProjectMobileTabsProps {
  projectId: string;
  projectName: string;
  activeSection: ProjectSection;
  widgetStep: WidgetStep;
}

const SECTION_TABS: Array<{ id: ProjectSection; label: string }> = [
  { id: 'widget-installation', label: 'Widget' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'integrations', label: 'Integrations' },
];

const WIDGET_SUB_STEPS: Array<{ id: WidgetStep; label: string }> = [
  { id: 'setup', label: 'Setup' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'fields', label: 'Fields' },
  { id: 'protection', label: 'Protection' },
  { id: 'publish', label: 'Publish' },
];

export function ProjectMobileTabs({ projectId, projectName, activeSection, widgetStep }: ProjectMobileTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'widget-installation');
    params.set('widgetStep', step);
    router.push(pathname + '?' + params.toString());
  };

  return (
    <div className="lg:hidden sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="border-b border-border/60 px-4 pb-3 pt-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-sm text-foreground transition-colors hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Project</p>
            <p className="truncate text-base font-semibold leading-tight text-foreground">{projectName}</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton className="h-9 w-9 rounded-lg p-0" />
            <ProjectSettingsLauncher
              projectId={projectId}
              projectName={projectName}
              variant="icon"
              className="h-9 w-9 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 pt-3">
        <div className="grid w-full grid-cols-2 gap-2">
          {SECTION_TABS.map((tab) => {
            const isActive = tab.id === activeSection;
            return (
              <Button
                key={tab.id}
                type="button"
                variant={isActive ? 'default' : 'secondary'}
                onClick={() => handleSectionChange(tab.id)}
                className={cn(
                  'h-11 w-full justify-center rounded-lg text-sm font-semibold transition-all duration-150',
                  !isActive && 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {activeSection === 'widget-installation' && (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/80">Widget steps</span>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[11px] font-medium uppercase tracking-widest text-primary">
                {activeWidgetIndex + 1}/{WIDGET_SUB_STEPS.length}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {WIDGET_SUB_STEPS.map((step) => {
                const isStepActive = step.id === widgetStep;
                return (
                  <Button
                    key={step.id}
                    type="button"
                    onClick={() => handleWidgetStepChange(step.id)}
                    variant={isStepActive ? 'default' : 'outline'}
                    className={cn(
                      'h-10 w-full justify-center rounded-lg text-xs font-semibold uppercase tracking-[0.2em]',
                      isStepActive ? 'bg-foreground text-background shadow-sm' : 'border-primary/30 text-primary hover:bg-primary/15'
                    )}
                  >
                    {step.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
