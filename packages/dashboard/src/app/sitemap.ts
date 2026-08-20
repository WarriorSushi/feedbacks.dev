import type { MetadataRoute } from 'next'
import { DOCS_PAGES } from '@/lib/docs-content'
import { SITE_ORIGIN } from '@/lib/site'
import { createAdminSupabase } from '@/lib/supabase-server'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docs = DOCS_PAGES.map((page) => ({
    url: page.slug === 'overview' ? `${SITE_ORIGIN}/docs` : `${SITE_ORIGIN}/docs/${page.slug}`,
    changeFrequency: 'monthly' as const,
    priority: page.slug === 'quickstart' ? 0.85 : 0.7,
  }))

  let publicBoards: MetadataRoute.Sitemap = []
  try {
    const admin = await createAdminSupabase()
    const { data, error } = await admin
      .from('public_board_settings')
      .select('slug, updated_at')
      .eq('enabled', true)
      .eq('visibility', 'public')
      .eq('directory_opt_in', true)
      .order('updated_at', { ascending: false })
      .limit(5000)

    if (error) throw error

    publicBoards = (data || [])
      .filter((board) => typeof board.slug === 'string' && board.slug.length > 0)
      .map((board) => ({
        url: `${SITE_ORIGIN}/p/${encodeURIComponent(board.slug)}`,
        lastModified: board.updated_at || undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
  } catch (error) {
    console.error('Could not add public boards to the sitemap', error)
  }

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
    ...publicBoards,
    {
      url: `${SITE_ORIGIN}/early-access`,
      changeFrequency: 'monthly',
      priority: 0.7,
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
