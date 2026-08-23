import { ProjectRequiredEmpty } from '@/components/project-required-empty'

const FEATURE_COPY: Record<string, { eyebrow: string; title: string; description: string }> = {
  'Customize form': {
    eyebrow: 'Feedback form',
    title: 'Create a project before configuring a feedback form',
    description: 'A project supplies the browser-safe key, form settings, and inbox where responses arrive.',
  },
  'Updates for users': {
    eyebrow: 'Product updates',
    title: 'Create a project before publishing updates',
    description: 'Updates belong to a project so the right users see the right release notes inside your product.',
  },
  'Public feedback board': {
    eyebrow: 'Public board',
    title: 'Create a project before opening a public board',
    description: 'Each public board is tied to one project, its feedback, and its visibility settings.',
  },
  'Project overview': {
    eyebrow: 'Project overview',
    title: 'Create a project before opening its overview',
    description: 'A project overview brings its feedback form, product updates, and installed connection together.',
  },
  'Install & test': {
    eyebrow: 'Install',
    title: 'Create a project before installing feedbacks.dev',
    description: 'Your project creates the exact copy-paste snippet and a safe place to verify the connection.',
  },
  Integrations: {
    eyebrow: 'Integrations',
    title: 'Create a project before connecting another tool',
    description: 'Routes and webhooks are configured per project so every destination stays predictable.',
  },
  'API & MCP': {
    eyebrow: 'API & MCP',
    title: 'Create a project before using the API or MCP',
    description: 'API credentials and agent setup packets are scoped to a project for safe, clear access.',
  },
}

export default async function ProjectRequiredPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>
}) {
  const { feature } = await searchParams
  const copy = FEATURE_COPY[feature || ''] || {
    eyebrow: 'Project required',
    title: 'Create your first project to continue',
    description: 'Projects keep installation, feedback, public updates, and integrations together.',
  }

  return <ProjectRequiredEmpty {...copy} />
}
