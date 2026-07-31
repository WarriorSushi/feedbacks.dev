import '@/lib/env' // validate env vars at startup
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { PublicThemeControl } from '@/components/public-theme-control'
import { Toaster } from '@/components/toaster'
import { SITE_ORIGIN } from '@/lib/site'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

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

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          themes={['light', 'dark', 'windows98']}
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          {children}
          <PublicThemeControl />
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
