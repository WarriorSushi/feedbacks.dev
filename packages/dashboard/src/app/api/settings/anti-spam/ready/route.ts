import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(_req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  const hasTurnstile = !!process.env.TURNSTILE_SECRET;
  const hasHCaptcha = !!process.env.HCAPTCHA_SECRET;
  return NextResponse.json({ turnstile: hasTurnstile, hcaptcha: hasHCaptcha });
}

