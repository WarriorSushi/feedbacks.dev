import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Minimal placeholder for edge rate limiting guidance.
// For production, back this with a KV (Upstash/Redis) or a Supabase table.
// Currently this just passes through.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/feedback'],
};

