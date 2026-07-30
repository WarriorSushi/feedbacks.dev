import type { MetadataRoute } from 'next'
import { DOCS_PAGES } from '@/lib/docs-content'
import { SITE_ORIGIN } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = DOCS_PAGES.map((page) => ({
    url: page.slug === 'overview' ? `${SITE_ORIGIN}/docs` : `${SITE_ORIGIN}/docs/${page.slug}`,
    changeFrequency: 'monthly' as const,
    priority: page.slug === 'quickstart' ? 0.85 : 0.7,
  }))

  return [
    {
      url: SITE_ORIGIN,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_ORIGIN}/boards`,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    ...docs,
    {
      url: `${SITE_ORIGIN}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_ORIGIN}/terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
