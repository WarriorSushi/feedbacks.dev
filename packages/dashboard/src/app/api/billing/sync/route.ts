import { NextResponse } from 'next/server'
import { getCurrentUserBillingSummary } from '@/lib/billing'

export async function GET() {
  const summary = await getCurrentUserBillingSummary()
  if (!summary) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(summary)
}
