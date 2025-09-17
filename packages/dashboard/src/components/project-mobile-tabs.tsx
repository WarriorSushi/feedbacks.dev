"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, BarChart3, Webhook, Code } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { RefreshButton } from '@/components/refresh-button';
import { ProjectSettingsLauncher } from '@/components/project-settings-launcher';
import { cn } from '@/lib/utils';
import type { WidgetStep } from '@/components/widget-installation';

export type ProjectSection = 'widget-installation' | 'feedback' | 'analytics' | 'integrations';

interface ProjectMobileTabsProps {
  projectId: string;
  projectName: string;
  activeSection: ProjectSection;
  widgetStep: WidgetStep;
}

type SectionTab = {
  id: ProjectSection;
  label: string;
  icon: LucideIcon;
};

const SECTION_TABS: SectionTab[] = [
  { id: 'widget-installation', label: 'Widget', icon: Code },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations', icon: Webhook },
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
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 px-3">
          <p className="truncate text-center text-sm font-semibold leading-tight">{projectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton className="h-8 w-8 rounded-full p-0" />
          <ProjectSettingsLauncher
            projectId={projectId}
            projectName={projectName}
            variant="icon"
            className="h-8 w-8"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 pb-2">
        {SECTION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeSection;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSectionChange(tab.id)}
              className={cn(
                'flex flex-shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeSection === 'widget-installation' && (
        <div className="flex gap-2 overflow-x-auto px-3 pb-3">
          {WIDGET_SUB_STEPS.map((step) => {
            const isStepActive = step.id === widgetStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleWidgetStepChange(step.id)}
                className={cn(
                  'flex flex-shrink-0 items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]',
                  isStepActive
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {step.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
