export type GuidedTutorialId =
  | 'navigation'
  | 'create-project'
  | 'customize-form'
  | 'install-widget'
  | 'triage-inbox'
  | 'publish-board'
  | 'connect-routing'

export interface GuidedTutorialStep {
  title: string
  body: string
  href: string
  target: string
  tip?: string
}

export interface GuidedTutorialDefinition {
  id: GuidedTutorialId
  title: string
  description: string
  steps: GuidedTutorialStep[]
}

export interface GuidedTutorialProgress {
  stepIndex: number
  completedAt?: string
  dismissedAt?: string
}

export const GUIDED_TUTORIAL_PROGRESS_KEY = 'feedbacks-guided-tutorial-progress'

export const GUIDED_TUTORIALS: GuidedTutorialDefinition[] = [
  {
    id: 'navigation',
    title: 'Guided product onboarding',
    description: 'Learn the complete feedback loop, then put it into practice with your first project.',
    steps: [
      {
        title: 'Understand the feedback loop',
        body: 'feedbacks.dev helps you collect a useful message, keep its page and browser context, decide what deserves action, and tell users what shipped.',
        href: '/dashboard',
        target: '[data-tour="nav-dashboard"]',
        tip: 'Start small: one project, one form, and one real test submission.',
      },
      {
        title: 'Know which project you are changing',
        body: 'Each website, app, or SaaS product is a project. Its form, inbox, installation, board, updates, and integrations stay grouped together.',
        href: '/dashboard',
        target: '[data-tour="project-switcher"]',
        tip: 'Check the selected project before copying code or changing settings.',
      },
      {
        title: 'Make the workspace comfortable',
        body: 'Switch between Light, Dark, Windows 98, or your device theme here. This changes your feedbacks.dev workspace without changing the form your customers see.',
        href: '/dashboard',
        target: '[data-tour="theme-switcher"]',
        tip: 'Theme choice follows you across the landing page, sign-in, and dashboard.',
      },
      {
        title: 'Choose how customers open the form',
        body: 'Use the floating button for the fastest setup, a custom trigger to reuse your own feedback button, or an inline form for a dedicated feedback page.',
        href: '/projects/{projectId}/feedback-form',
        target: '[data-tour="widget-placement"]',
        tip: 'The floating button is the best default. Change modes only when your product layout calls for it.',
      },
      {
        title: 'Match the launcher to your product',
        body: 'Set the primary color, button label, and screen position. These settings are delivered remotely to every installed embed.',
        href: '/projects/{projectId}/feedback-form',
        target: '[data-tour="widget-appearance"]',
        tip: 'Use a clear label such as Send feedback instead of a clever phrase users may not recognize.',
      },
      {
        title: 'Ask for a useful message',
        body: 'Customize the form title and message prompt so customers know what detail helps. Good prompts ask what happened, what they expected, or what they were trying to do.',
        href: '/projects/{projectId}/feedback-form',
        target: '[data-tour="widget-content"]',
        tip: 'Keep the main prompt broad enough for bugs, ideas, praise, and questions.',
      },
      {
        title: 'Add fields only when they earn their place',
        body: 'Type and rating help with triage. Screenshots help explain visual bugs. Email enables follow-up. Human verification protects public forms from automated abuse.',
        href: '/projects/{projectId}/feedback-form',
        target: '[data-tour="widget-protection"]',
        tip: 'Every required field adds friction. Begin with the message, then add fields based on real feedback.',
      },
      {
        title: 'Preview before you save',
        body: 'The live preview shows draft placement, color, copy, and optional fields. Saving publishes the configuration without asking you to replace the installed snippet.',
        href: '/projects/{projectId}/feedback-form',
        target: '[data-tour="widget-preview"]',
        tip: 'Test the form at mobile width too, especially after changing copy or enabling more fields.',
      },
      {
        title: 'Choose the install guide for your app',
        body: 'Website works for plain HTML and most script-based sites. Choose React, Next.js, Vue, or WordPress when that guide matches the shared shell of your product.',
        href: '/projects/{projectId}/install',
        target: '[data-tour="install-platforms"]',
        tip: 'Install once in the shared layout or app shell, not separately on every page.',
      },
      {
        title: 'Install once, then verify with a real test',
        body: 'Copy the generated embed, load your product, and submit a known-good message. Verification confirms that the browser project key and inbox are connected.',
        href: '/projects/{projectId}/install',
        target: '[data-tour="install-code"]',
        tip: 'Use a recognizable test message so it is easy to find and remove from the inbox.',
      },
      {
        title: 'Turn messages into decisions',
        body: 'The inbox brings message, page, browser, device, time, rating, and optional screenshot together. Search and filter before changing workflow status.',
        href: '/feedback',
        target: '[data-tour="inbox-filters"]',
        tip: 'Unread is a reading state. New, Reviewed, Planned, In Progress, and Closed describe the work.',
      },
      {
        title: 'Use each feedback type differently',
        body: 'Investigate bugs with captured context, group ideas into recurring themes, share praise with the team, and answer questions while the customer intent is still clear.',
        href: '/feedback',
        target: '[data-tour="inbox-list"]',
        tip: 'Tags should describe durable themes such as onboarding or billing, not repeat the full message.',
      },
      {
        title: 'Close the loop with product updates',
        body: 'Publish what shipped so customers see progress inside your product. Updates are for your product and customers, not announcements about feedbacks.dev.',
        href: '/projects/{projectId}/release-notes',
        target: '[data-tour="nav-updates"]',
        tip: 'Write the customer outcome first, then add implementation detail only when it helps.',
      },
      {
        title: 'Use a public board for shared demand',
        body: 'A public feedback board lets customers browse, submit, and vote on ideas. Keep sensitive bug reports and account-specific feedback private in the inbox.',
        href: '/projects/{projectId}/board',
        target: '[data-tour="nav-boards"]',
        tip: 'A focused board with clear categories is easier to trust than an uncurated feature dump.',
      },
      {
        title: 'Route high-signal work to your team',
        body: 'Connect Slack, Discord, GitHub, or a webhook when important feedback should enter an existing workflow. Save and test every endpoint before relying on it.',
        href: '/projects/{projectId}/integrations',
        target: '[data-tour="integration-endpoint"]',
        tip: 'Route deliberately. Forwarding every message creates noise and makes important feedback easier to miss.',
      },
      {
        title: 'Run your first complete loop',
        body: 'Customize the form, install it, submit one test, inspect its context, set a workflow status, and publish an update when something ships. You now know the complete product path.',
        href: '/dashboard',
        target: '[data-tour="dashboard-capabilities"]',
        tip: 'Your next best step is to install the floating button on one real product and collect the first customer message.',
      },
    ],
  },
  {
    id: 'create-project',
    title: 'Create a project',
    description: 'Learn what a project is and where to create one.',
    steps: [
      { title: 'Your projects', body: 'A project is one app or website. Feedback, install settings, integrations, and a public board stay grouped here.', href: '/projects', target: '[data-tour="project-surface"]' },
      { title: 'Start a project', body: 'Use New Project when you are ready. The only required field is a name your team recognizes.', href: '/projects', target: '[data-tour="new-project"]' },
      { title: 'Name it clearly', body: 'Enter the product or site name. A domain is optional and can be added later.', href: '/projects/new', target: '[data-tour="project-create-form"]' },
      { title: 'Choose the first product', body: 'Start by collecting feedback, showing updates to users, or both. This lesson will not create anything for you.', href: '/projects/new', target: '[data-tour="project-create-submit"]' },
    ],
  },
  {
    id: 'customize-form',
    title: 'Customize the feedback form',
    description: 'Choose placement, fields, labels, and preview the result.',
    steps: [
      { title: 'Feedback form', body: 'Change placement, wording, fields, and anti-spam settings remotely.', href: '/projects/{projectId}/feedback-form', target: '[data-tour="nav-feedback-form"]' },
      { title: 'Remote configuration', body: 'Choose placement, labels, color, and optional fields, then save once to update every installed embed.', href: '/projects/{projectId}/feedback-form', target: '[data-tour="widget-settings"]' },
      { title: 'Live preview', body: 'Preview the form before publishing the remote configuration.', href: '/projects/{projectId}/feedback-form', target: '[data-tour="widget-preview"]' },
    ],
  },
  {
    id: 'install-widget',
    title: 'Install and verify',
    description: 'Find the right snippet and confirm one real submission.',
    steps: [
      { title: 'Open Embed installation', body: 'Add the stable embed once. Form and release-note changes are managed remotely afterward.', href: '/projects/{projectId}/install', target: '[data-tour="setup-progress"]' },
      { title: 'Choose your platform', body: 'Website is the default. Choose WordPress, React, Next.js, or Vue only when that matches your app shell.', href: '/projects/{projectId}/install', target: '[data-tour="install-platforms"]' },
      { title: 'Copy the generated code', body: 'This section shows the exact snippet or explains when a fresh project key is needed. Paste generated code once in the shared page or app shell.', href: '/projects/{projectId}/install', target: '[data-tour="install-snippet-header"]' },
      { title: 'Send one known-good test', body: 'Use hosted verification after installing, then confirm the item appears in the project inbox.', href: '/projects/{projectId}/verify', target: '[data-tour="verify-guide"]' },
    ],
  },
  {
    id: 'triage-inbox',
    title: 'Triage the inbox',
    description: 'Understand search, filters, read state, and workflow status.',
    steps: [
      { title: 'Find the right signal', body: 'Search message text or narrow the inbox by tag before changing workflow state.', href: '/feedback', target: '[data-tour="inbox-search"]' },
      { title: 'Use filters', body: 'Unread is a reading state. New, Reviewed, Planned, In Progress, and Closed are workflow decisions.', href: '/feedback', target: '[data-tour="inbox-filters"]' },
      { title: 'Open an item', body: 'Each row shows source, project, status, tags, rating, and time. Opening it marks it read but does not change its status.', href: '/feedback', target: '[data-tour="inbox-first-item"]' },
    ],
  },
  {
    id: 'publish-board',
    title: 'Publish a public board',
    description: 'Configure, publish, preview, and manage a project board.',
    steps: [
      { title: 'Selected project board', body: 'This page follows the project selected in the sidebar. Draft boards stay private until you publish them.', href: '/dashboard/boards?project={projectId}', target: '[data-tour="owner-boards-summary"]' },
      { title: 'Board settings', body: 'Open a project board to set its name, visibility, categories, submissions, and directory listing.', href: '/projects/{projectId}/board', target: '[data-tour="nav-boards"]' },
      { title: 'Preview before sharing', body: 'After publishing, use Preview to inspect the selected project’s public experience.', href: '/dashboard/boards?project={projectId}', target: '[data-tour="owner-board-list"]' },
    ],
  },
  {
    id: 'connect-routing',
    title: 'Connect routing',
    description: 'Send selected project feedback into an existing team workflow.',
    steps: [
      { title: 'Check the current project', body: 'Integrations use the project selected at the top of the sidebar. Switch it here before opening routing.', href: '/dashboard', target: '[data-tour="project-switcher"]' },
      { title: 'Open Integrations', body: 'Integrations stays scoped to the project selected in the sidebar.', href: '/projects/{projectId}/integrations', target: '[data-tour="nav-integrations"]' },
      { title: 'Add and test an endpoint', body: 'Choose Slack, Discord, GitHub, or a generic webhook. Save it, send a test, then check delivery history.', href: '/projects/{projectId}/integrations', target: '[data-tour="integration-endpoint"]' },
    ],
  },
]

export function getGuidedTutorial(id: string | null | undefined) {
  return GUIDED_TUTORIALS.find((tutorial) => tutorial.id === id) || null
}

export function usesBuiltInTutorialWorkspace(id: string | null | undefined) {
  return id === 'navigation'
}

export function isUsableTutorialProjectId(projectId?: string) {
  return Boolean(projectId && !['new', 'undefined', 'null'].includes(projectId))
}

export function resolveTutorialHref(href: string, projectId?: string) {
  if (!href.includes('{projectId}')) return href
  return isUsableTutorialProjectId(projectId)
    ? href.replace('{projectId}', projectId!)
    : '/projects/new'
}

export function withTutorialContext(href: string, tutorialId: GuidedTutorialId, stepIndex: number) {
  const [pathname, query = ''] = href.split('?')
  const search = new URLSearchParams(query)
  search.set('guidedTour', tutorialId)
  search.set('tourStep', String(stepIndex))
  return `${pathname}?${search.toString()}`
}
