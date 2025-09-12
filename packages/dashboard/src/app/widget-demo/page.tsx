'use client';

import Script from 'next/script';
import { useCallback, useMemo } from 'react';

type DemoParams = { apiKey?: string; config?: string };

export default function WidgetDemo({ searchParams }: { searchParams?: DemoParams }) {
  const apiKey = searchParams?.apiKey || 'feedbacks_dev_api_key_demo123';
  const config = useMemo(() => {
    if (!searchParams?.config) return null;
    try { return JSON.parse(searchParams.config); } catch { return null; }
  }, [searchParams?.config]);

  const init = useCallback(() => {
    const Widget: any = (window as any).FeedbacksWidget;
    if (!Widget) return;
    try {
      if (config && typeof config === 'object') {
        // One instance using provided config
        new Widget({ projectKey: apiKey, ...config });
      } else {
        // Showcase all modes
        new Widget({ projectKey: apiKey, target: '#feedback-widget', embedMode: 'inline', requireCaptcha: true, captchaProvider: 'turnstile', turnstileSiteKey: '1x00000000000000000000AA' });
        new Widget({ projectKey: apiKey, target: '#feedback-btn', embedMode: 'trigger', requireCaptcha: true, captchaProvider: 'hcaptcha', hcaptchaSiteKey: '10000000-ffff-ffff-ffff-000000000001' });
        new Widget({ projectKey: apiKey, requireCaptcha: false });
      }
    } catch {}
  }, [apiKey, config]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-2">Feedbacks Widget Demo</h1>
        <p className="text-sm text-gray-600 mb-6">Loaded from CDN. Use this page to quickly test your API key. Captcha previews shown with test site keys.</p>

        <div className="space-y-6">
          {!config && (
            <>
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
            </>
          )}
          {config && (
            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Preview Using Config</h2>
              {config.embedMode === 'inline' && <div id="feedback-widget" />}
              {config.embedMode === 'trigger' && <button id="feedback-btn" className="px-3 py-1.5 rounded bg-blue-600 text-white">Give Feedback</button>}
              {config.embedMode !== 'inline' && config.embedMode !== 'trigger' && (
                <p className="text-sm text-gray-600">A floating button appears in the configured position.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <Script src="https://app.feedbacks.dev/cdn/widget/latest.js" strategy="afterInteractive" onLoad={init} />
      <link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/latest.css" />
    </div>
  );
}
