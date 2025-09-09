'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export default function WidgetDemo({ searchParams }: { searchParams?: { apiKey?: string } }) {
  const apiKey = searchParams?.apiKey || 'feedbacks_dev_api_key_demo123';

  useEffect(() => {
    function init() {
      const Widget: any = (window as any).FeedbacksWidget;
      if (!Widget) return;
      try {
        // Inline example
        new Widget({ projectKey: apiKey, target: '#feedback-widget', embedMode: 'inline' });
        // Trigger example
        new Widget({ projectKey: apiKey, target: '#feedback-btn', embedMode: 'trigger' });
        // Floating button (modal) example
        new Widget({ projectKey: apiKey });
      } catch (e) {
        // no-op
      }
    }
    // Attempt init on load and on script load
    init();
    (window as any).__feedbacksInit = init;
    return () => { delete (window as any).__feedbacksInit; };
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

      {/* Load latest widget from CDN */}
      <Script
        src="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-latest.js"
        strategy="afterInteractive"
        onLoad={() => (window as any).__feedbacksInit && (window as any).__feedbacksInit()}
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-latest.css"
      />
    </div>
  );
}

