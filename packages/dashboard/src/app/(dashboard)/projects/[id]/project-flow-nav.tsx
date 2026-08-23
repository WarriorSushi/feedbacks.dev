import { CompactSteps } from '@/components/ui/workspace-shell'

export type SetupStep = 'install' | 'verify' | 'inbox' | 'customize'

export function SetupProgress({
  projectId,
  activeStep,
}: {
  projectId: string
  activeStep: SetupStep
}) {
  const steps: Array<{ id: SetupStep; label: string; href: string }> = [
    { id: 'install', label: 'Install', href: `/projects/${projectId}/install` },
    { id: 'verify', label: 'Test', href: `/projects/${projectId}/verify` },
    { id: 'inbox', label: 'Inbox', href: `/feedback?projectId=${projectId}` },
    { id: 'customize', label: 'Customize', href: `/projects/${projectId}/feedback-form` },
  ]
  const activeIndex = Math.max(steps.findIndex((step) => step.id === activeStep), 0)

  return (
    <nav
      aria-label="Setup steps"
      data-tour="setup-progress"
      className="flex min-h-12 flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          First connection
        </p>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          Step {activeIndex + 1} of {steps.length}
        </p>
      </div>
      <CompactSteps
        steps={steps.map(({ label, href }) => ({ label, href }))}
        activeIndex={activeIndex}
      />
    </nav>
  )
}
