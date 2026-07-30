import type { MetadataRoute } from 'next'
import { SITE_ORIGIN } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/docs/', '/boards', '/p/'],
      disallow: [
        '/api/',
        '/auth',
        '/billing',
        '/dashboard',
        '/feedback',
        '/integrations',
        '/projects',
        '/settings',
        '/tutorials',
        '/updates',
      ],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}
