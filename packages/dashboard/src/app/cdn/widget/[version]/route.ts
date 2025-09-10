import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Widget version mapping and resolution
const VERSION_PATTERNS = {
  'latest': () => '1.0.0', // Always return latest stable
  'stable': () => '1.0.0', // Latest stable version
  '1.0': () => '1.0.0',    // Latest patch in 1.0.x series
  '1': () => '1.0.0',      // Latest minor in 1.x.x series
};

function resolveVersion(requestedVersion: string): string | null {
  // Exact version (e.g., "1.0.0")
  if (/^\d+\.\d+\.\d+$/.test(requestedVersion)) {
    return requestedVersion;
  }
  
  // Pattern-based version (e.g., "latest", "1.0", "1")
  const resolver = VERSION_PATTERNS[requestedVersion as keyof typeof VERSION_PATTERNS];
  return resolver ? resolver() : null;
}

function getWidgetFilePath(version: string, type: 'js' | 'css'): string {
  const widgetDir = join(process.cwd(), '../../packages/widget/dist');
  return join(widgetDir, `widget-${version}.${type}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { version: string } }
) {
  try {
    const requestedVersion = params.version;
    const url = new URL(request.url);
    const fileType = url.pathname.endsWith('.css') ? 'css' : 'js';
    
    // Remove file extension from version if present
    const cleanVersion = requestedVersion.replace(/\.(js|css)$/, '');
    
    // Resolve to actual version
    const actualVersion = resolveVersion(cleanVersion);
    if (!actualVersion) {
      return new NextResponse('Version not found', { status: 404 });
    }
    
    // Get file path
    const filePath = getWidgetFilePath(actualVersion, fileType);
    
    if (!existsSync(filePath)) {
      return new NextResponse(`Widget version ${actualVersion} not found`, { status: 404 });
    }
    
    // Read file content
    const content = readFileSync(filePath, 'utf8');
    
    // Set appropriate headers
    const headers = new Headers();
    
    if (fileType === 'js') {
      headers.set('Content-Type', 'application/javascript; charset=utf-8');
    } else {
      headers.set('Content-Type', 'text/css; charset=utf-8');
    }
    
    // Cache headers based on version type
    if (cleanVersion.match(/^\d+\.\d+\.\d+$/)) {
      // Exact version - cache forever
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // Pattern version (latest, 1.0, etc.) - cache for shorter time
      headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Widget-Version', actualVersion);
    
    return new NextResponse(content, { headers });
    
  } catch (error) {
    console.error('CDN error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Max-Age': '86400',
    },
  });
}