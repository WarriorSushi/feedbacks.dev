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

    const { error } = await result.admin.rpc('rotate_project_api_key', {
      p_project_id: result.project.id,
      p_key_hash: nextHash,
      p_key_last_four: nextLastFour,
      p_actor_user_id: result.user.id,
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to rotate API key' }, { status: 500 })
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
