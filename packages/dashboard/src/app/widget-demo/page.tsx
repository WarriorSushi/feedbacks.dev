'use client';

import Script from 'next/script';
import { useCallback } from 'react';

export default function WidgetDemo({ searchParams }: { searchParams?: { apiKey?: string } }) {
  const apiKey = searchParams?.apiKey || 'feedbacks_dev_api_key_demo123';
  const init = useCallback(() => {
    const Widget: any = (window as any).FeedbacksWidget;
    if (!Widget) return;
    try {
      // Inline example
      new Widget({ projectKey: apiKey, target: '#feedback-widget', embedMode: 'inline' });
      // Trigger example
      new Widget({ projectKey: apiKey, target: '#feedback-btn', embedMode: 'trigger' });
      // Floating button (modal) example
      new Widget({ projectKey: apiKey });
    } catch {}
  }, [apiKey]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Feedbacks Widget Demo</h1>
        <p className="text-sm text-gray-600 mb-6">Loaded from CDN. Use this page to quickly test your API key.</p>

        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Inline Embed</h2>
            <div id="feedback-widget" />
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Trigger Button</h2>
            <button id="feedback-btn" className="px-3 py-1.5 rounded bg-blue-600 text-white">Give Feedback</button>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Floating Button</h2>
            <p className="text-sm text-gray-600">A floating button appears in the bottom-right corner.</p>
          </div>
        </div>
      </div>

      {/* Load the widget once, then instantiate all 3 modes */}
      <Script
        src="https://app.feedbacks.dev/cdn/widget/latest.js"
        strategy="afterInteractive"
        onLoad={init}
      />
      <link
        rel="stylesheet"
        href="https://app.feedbacks.dev/cdn/widget/latest.css"
      />
    </div>
  );
}
