import { NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import {
  generateProjectApiKey,
  getProjectApiKeyLastFour,
  hashProjectApiKey,
} from '@/lib/project-api-keys'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result) return result.error

    const nextApiKey = generateProjectApiKey()
    const nextHash = await hashProjectApiKey(nextApiKey)
    const nextLastFour = getProjectApiKeyLastFour(nextApiKey)

    const { error } = await result.admin
      .from('projects')
      .update({
        api_key: null,
        api_key_hash: nextHash,
        api_key_last_four: nextLastFour,
        updated_at: new Date().toISOString(),
      })
      .eq('id', result.project.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      project_id: result.project.id,
      api_key: nextApiKey,
      api_key_last_four: nextLastFour,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
