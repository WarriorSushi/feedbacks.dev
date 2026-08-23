'use client'

import Script from 'next/script'
import { FEEDBACKS_DEV_PROJECT_KEY } from '@/lib/dogfood-widget'

export function FeedbacksWidgetScript() {
  return (
    <>
      <div className="mt-7 empty:hidden" data-feedbacks-host={FEEDBACKS_DEV_PROJECT_KEY} />
      <Script
        src="https://app.feedbacks.dev/widget/latest.js"
        data-project={FEEDBACKS_DEV_PROJECT_KEY}
        data-feedbacks-manual-trigger
        strategy="afterInteractive"
      />
    </>
  )
}
