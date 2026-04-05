'use client'

import { Terminal } from '@/components/ui/terminal'

interface LandingTerminalDemoProps {
  websiteSnippet: string
}

export function LandingTerminalDemo({ websiteSnippet }: LandingTerminalDemoProps) {
  const snippetLines = websiteSnippet.split('\n').filter(Boolean)

  return (
    <div className="w-full">
      <Terminal
        username="install@feedbacks"
        commands={[
          'cat website-snippet.html',
          'pnpm dev',
          'tail -n 1 feedbacks-inbox.log',
        ]}
        outputs={{
          0: snippetLines,
          1: [
            '▲ Next.js 15.1.0',
            '- Local: http://localhost:3000',
            '- Widget button visible and ready for a live test',
          ],
          2: [
            'new | bug | "CSV export crashes on large sets" | /export',
            'captured context: url, browser, timestamp',
          ],
        }}
        typingSpeed={34}
        delayBetweenCommands={900}
        initialDelay={250}
        enableSound={false}
        className="max-w-none px-0"
      />
    </div>
  )
}
