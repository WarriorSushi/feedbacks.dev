import { NextResponse } from 'next/server'
import { getEmailDeliveryCapability } from '@/lib/email-delivery-capability'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const emailDelivery = await getEmailDeliveryCapability()

  return NextResponse.json(
    {
      emailDeliveryAvailable: emailDelivery.available,
      emailDeliveryStatus: emailDelivery.status,
      emailSenderDomain: emailDelivery.senderDomain,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
