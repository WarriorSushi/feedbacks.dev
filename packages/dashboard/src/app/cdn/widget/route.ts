import { NextRequest, NextResponse } from 'next/server';

// CDN documentation endpoint
export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  
  const documentation = {
    name: 'Feedbacks.dev Widget CDN',
    version: '1.0',
    description: 'Professional CDN for feedbacks.dev widget with smart versioning',
    baseUrl: `${baseUrl}/cdn/widget`,
    
    examples: {
      stable: {
        description: 'Recommended for production - Gets bug fixes automatically, stable features',
        javascript: `${baseUrl}/cdn/widget/1.0.js`,
        css: `${baseUrl}/cdn/widget/1.0.css`
      },
      exact: {
        description: 'Pin to exact version - Most stable, never changes',
        javascript: `${baseUrl}/cdn/widget/1.0.0.js`, 
        css: `${baseUrl}/cdn/widget/1.0.0.css`
      },
      latest: {
        description: 'Always latest features - May have breaking changes',
        javascript: `${baseUrl}/cdn/widget/latest.js`,
        css: `${baseUrl}/cdn/widget/latest.css`
      }
    },
    
    integration: {
      html: `<!-- Stable version (recommended) -->
<script src="${baseUrl}/cdn/widget/1.0.js"></script>
<link rel="stylesheet" href="${baseUrl}/cdn/widget/1.0.css">

<script>
  new FeedbacksWidget({
    projectKey: 'your-api-key',
    embedMode: 'modal' // or 'inline', 'trigger'
  });
</script>`,
      
      react: `import { useEffect } from 'react';

export function FeedbackWidget({ projectKey }) {
  useEffect(() => {
    // Load widget script
    const script = document.createElement('script');
    script.src = '${baseUrl}/cdn/widget/1.0.js';
    script.onload = () => {
      new window.FeedbacksWidget({ projectKey });
    };
    document.head.appendChild(script);
  }, [projectKey]);
  
  return null;
}`
    },
    
    availableVersions: [
      '1.0.0',
      '1.0',   // Latest patch in 1.0.x
      '1',     // Latest minor in 1.x.x  
      'latest',
      'stable'
    ],
    
    caching: {
      exactVersions: 'Cached forever (immutable)',
      patternVersions: 'Cached for 5 minutes',
      headers: ['Cache-Control', 'X-Widget-Version', 'Access-Control-Allow-Origin']
    }
  };
  
  return NextResponse.json(documentation, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    }
  });
}