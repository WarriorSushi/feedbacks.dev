import { NextResponse } from 'next/server'
import { getEmailDeliveryCapability } from '@/lib/email-delivery-capability'
import { canUserReceiveEmailAlerts } from '@/lib/billing'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [emailDelivery, emailAlertsAvailable] = await Promise.all([
    getEmailDeliveryCapability(),
    canUserReceiveEmailAlerts(user.id, user.email),
  ])

  return NextResponse.json(
    {
      emailDeliveryAvailable: emailDelivery.available,
      emailDeliveryStatus: emailDelivery.status,
      emailSenderDomain: emailDelivery.senderDomain,
      emailAlertsAvailable,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
