'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, CircleHelp, Clock3, FolderCheck, MailCheck, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    icon: MailCheck,
    title: 'Verify the account',
    body: 'The invited person confirms ownership of a new email address.',
  },
  {
    icon: FolderCheck,
    title: 'Activate a real project',
    body: 'A verified install or a first received feedback item proves genuine product use.',
  },
  {
    icon: Clock3,
    title: 'Complete the safety window',
    body: 'Qualification waits at least 24 hours and checks duplicate identity and reuse signals.',
  },
]

export function InviteGuide() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CircleHelp className="h-4 w-4" />
          How invites qualify
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/30 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-background shadow-[var(--shadow-float)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:duration-150 data-[state=open]:duration-200 motion-reduce:animate-none">
          <header className="flex items-start justify-between gap-4 border-b px-5 py-5 sm:px-6">
            <div>
              <Dialog.Title className="text-lg font-semibold tracking-tight">How an invite earns a spot</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm leading-6 text-muted-foreground">
                The progress bar counts genuine activations, not clicks or email signups.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="-mr-2 -mt-2 shrink-0" aria-label="Close invite guide">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
            <ol className="space-y-0">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={step.title} className="relative flex gap-4 pb-7 last:pb-0">
                    {index < steps.length - 1 && <span aria-hidden="true" className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-border" />}
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-surface-raised text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold">{index + 1}. {step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                )
              })}
            </ol>

            <div className="mt-8 border-t pt-5">
              <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />What a review means</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Repeated device use can pause an invite for manual review. A shared network alone never rejects a person, and raw IP addresses are not stored.
              </p>
            </div>
          </div>

          <footer className="border-t bg-surface-raised/45 px-5 py-4 sm:px-6">
            <Dialog.Close asChild>
              <Button className="w-full gap-2">Got it <ArrowRight className="h-4 w-4" /></Button>
            </Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
