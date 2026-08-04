import '@/lib/env' // validate env vars at startup
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { PublicThemeControl } from '@/components/public-theme-control'
import { Toaster } from '@/components/toaster'
import { SITE_ORIGIN } from '@/lib/site'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { MarketingMeasurement } from '@/components/marketing-measurement'
import { Suspense } from 'react'
import { APPEARANCE_COOKIE_NAME, normalizeAppearanceTheme } from '@/lib/appearance'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: 'feedbacks.dev | Feedback forms and product updates',
    template: '%s | feedbacks.dev',
  },
  description: 'Collect in-product feedback and show product updates to users with one lightweight embed. Install once, verify, and manage remotely.',
  applicationName: 'feedbacks.dev',
  keywords: [
    'user feedback widget',
    'in-app feedback',
    'product feedback',
    'feature request board',
    'product updates',
    'feedback API',
  ],
  authors: [{ name: 'feedbacks.dev', url: SITE_ORIGIN }],
  creator: 'feedbacks.dev',
  publisher: 'feedbacks.dev',
  icons: {
    icon: [
      { url: '/new_logo_feedbacks.dev.svg', type: 'image/svg+xml' },
    ],
    shortcut: [{ url: '/new_logo_feedbacks.dev.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/new_logo_feedbacks.dev.svg', type: 'image/svg+xml' }],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // A nonce-based CSP only works when Next renders per request and can attach
  // the middleware nonce to framework and hydration scripts.
  const nonce = (await headers()).get('x-nonce') || undefined
  const pathname = (await headers()).get('x-pathname') || '/'
  const sharedAppearance = normalizeAppearanceTheme((await cookies()).get(APPEARANCE_COOKIE_NAME)?.value)
  const showMarketingConsent = pathname === '/' || pathname === '/auth' || pathname.startsWith('/early-access')
  const appearanceSyncScript = sharedAppearance
    ? `try{localStorage.setItem('theme',${JSON.stringify(sharedAppearance)})}catch{}`
    : ''

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={inter.className}>
        {appearanceSyncScript && (
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: appearanceSyncScript }} />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          themes={['light', 'dark', 'windows98']}
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          {children}
          <PublicThemeControl />
          <Toaster />
          <Suspense>
            <MarketingMeasurement
              showBanner={showMarketingConsent}
              config={{
                googleTagId: process.env.NEXT_PUBLIC_GOOGLE_TAG_ID,
                googleLeadLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL,
                googleSignupLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL,
                metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
                redditPixelId: process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID,
              }}
            />
          </Suspense>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
