import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

const allowedOrigins = new Set([
  'https://www.feedbacks.dev',
  'https://feedbacks.dev',
  'https://app.feedbacks.dev',
  'http://localhost:3000',
]);

function corsHeadersFor(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Credentials': 'true',
  };
  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    const origin = request.headers.get('origin');
    const baseHeaders = corsHeadersFor(origin);

    if (error) {
      return NextResponse.json(
        { authenticated: false }, 
        { headers: baseHeaders }
      );
    }
    
    return NextResponse.json(
      { 
        authenticated: !!user,
        email: user?.email 
      },
      { headers: baseHeaders }
    );
  } catch (error) {
    const origin = (error as any)?.request?.headers?.get?.('origin') ?? null;
    return NextResponse.json(
      { authenticated: false },
      { headers: corsHeadersFor(origin) }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const baseHeaders = corsHeadersFor(origin);
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...baseHeaders,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
