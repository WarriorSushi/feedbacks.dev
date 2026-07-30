import type { MetadataRoute } from 'next'
import { DOCS_PAGES } from '@/lib/docs-content'

const ORIGIN = 'https://feedbacks.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = DOCS_PAGES.map((page) => ({
    url: page.slug === 'overview' ? `${ORIGIN}/docs` : `${ORIGIN}/docs/${page.slug}`,
    changeFrequency: 'monthly' as const,
    priority: page.slug === 'quickstart' ? 0.85 : 0.7,
  }))

  return [
    {
      url: ORIGIN,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${ORIGIN}/boards`,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    ...docs,
    {
      url: `${ORIGIN}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${ORIGIN}/terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
