'use client';

import Script from 'next/script';

export default function WidgetDemo({ searchParams }: { searchParams?: { apiKey?: string } }) {
  const apiKey = searchParams?.apiKey || 'feedbacks_dev_api_key_demo123';

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

      {/* Inline instance via auto-init */}
      <Script
        src="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-latest.js"
        strategy="afterInteractive"
        data-project={apiKey}
        data-embed-mode="inline"
        data-target="#feedback-widget"
      />

      {/* Trigger instance via auto-init */}
      <Script
        src="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-latest.js"
        strategy="afterInteractive"
        data-project={apiKey}
        data-embed-mode="trigger"
        data-target="#feedback-btn"
      />

      {/* Floating button instance via auto-init (modal) */}
      <Script
        src="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-latest.js"
        strategy="afterInteractive"
        data-project={apiKey}
      />

      {/* Styles */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-latest.css"
      />
    </div>
  );
}
