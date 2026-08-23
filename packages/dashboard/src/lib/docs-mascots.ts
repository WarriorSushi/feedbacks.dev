export const DOCS_MASCOT_BY_SLUG = {
  overview: '/mascots-dashboard/docs-librarian.png',
  quickstart: '/mascots-v2/journey-runner.png',
  'concepts/projects': '/mascot-context-investigator-v1.png',
  'install/website': '/mascots-v2/install-mechanic.png',
  'install/frameworks': '/mascot-install-agent-scene-v2.png',
  'install/customize': '/mascot-feedback-press-v1.png',
  'install/product-updates': '/mascots-v2/loop-courier.png',
  'install/verify': '/mascots-v2/context-detective.png',
  'feedback/inbox': '/mascots-v2/inbox-controller.png',
  'feedback/public-boards': '/mascot-public-board-v1.png',
  'integrations/webhooks': '/mascot_withlaptop_connected_to_everything.webp',
  'api/rest': '/mascot-install-agent-scene-v2.png',
  'api/mcp': '/mascot-context-investigator-v1.png',
  'api/context': '/mascots-v2/context-detective.png',
  'operate/security': '/mascots-dashboard/settings-mechanic.png',
  'operate/limits': '/mascots-v2/proof-scale.png',
  'operate/troubleshooting': '/mascot-triage-controller-v1.png',
} as const

export function getDocsMascot(slug: string) {
  return DOCS_MASCOT_BY_SLUG[slug as keyof typeof DOCS_MASCOT_BY_SLUG]
    || DOCS_MASCOT_BY_SLUG.overview
}
