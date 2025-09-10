import { NextResponse } from 'next/server';

// CDN index page - redirect to widget documentation
export async function GET() {
  return NextResponse.redirect('/cdn/widget', 301);
}