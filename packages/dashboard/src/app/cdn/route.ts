import { NextRequest, NextResponse } from 'next/server';

// CDN index page - redirect to widget documentation
export async function GET(request: NextRequest) {
  const url = new URL('/cdn/widget', request.url);
  return NextResponse.redirect(url, 301);
}