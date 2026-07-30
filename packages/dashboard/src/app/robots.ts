import type { MetadataRoute } from 'next'

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
    sitemap: 'https://feedbacks.dev/sitemap.xml',
    host: 'https://feedbacks.dev',
  }
}
