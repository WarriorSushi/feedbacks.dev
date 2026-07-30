import { createServerSupabase } from '@/lib/supabase-server'
import { sanitizeRedirectPath } from '@/lib/redirects'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = sanitizeRedirectPath(searchParams.get('redirect'), '/dashboard')

  if (code) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  const authUrl = new URL('/auth', origin)
  authUrl.searchParams.set('error', 'auth_failed')
  authUrl.searchParams.set('redirect', redirect)
  return NextResponse.redirect(authUrl)
}
