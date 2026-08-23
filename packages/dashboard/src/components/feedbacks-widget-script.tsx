'use client'

import Script from 'next/script'

const FEEDBACKS_DEV_PROJECT_KEY = 'fb_pub_eca05612446143cb95127d91753e2a48'

export function FeedbacksWidgetScript() {
  return (
    <>
      <div data-feedbacks-host={FEEDBACKS_DEV_PROJECT_KEY} />
      <Script
        src="https://app.feedbacks.dev/widget/latest.js"
        data-project={FEEDBACKS_DEV_PROJECT_KEY}
        data-feedbacks-manual-trigger
        strategy="afterInteractive"
      />
    </>
  )
}
