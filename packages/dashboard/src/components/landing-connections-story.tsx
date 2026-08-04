import {
  Bot,
  Check,
  Github,
  Globe2,
  MessageCircle,
  MessageSquare,
  Slack,
  Webhook,
} from 'lucide-react'

const destinations = [
  { label: 'Slack', detail: 'Tell the product channel', Icon: Slack, tone: 'text-[#c4b5fd]' },
  { label: 'GitHub', detail: 'Open an issue', Icon: Github, tone: 'text-zinc-100' },
  { label: 'Discord', detail: 'Post to your server', Icon: MessageCircle, tone: 'text-[#7dd3fc]' },
  { label: 'Webhook', detail: 'Send it anywhere', Icon: Webhook, tone: 'text-[#fdba74]' },
] as const

export function LandingConnectionsStory() {
  return (
    <div className="landing-connections-story overflow-hidden border-y border-foreground/15 bg-[#111214] text-zinc-100 shadow-[var(--shadow-float)] sm:rounded-[16px] sm:border">
      <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
        <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div className="flex items-start gap-3 border-b border-white/10 pb-6">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-lime-300 text-zinc-950">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-lime-300">New feedback</p>
              <p className="mt-2 text-sm font-semibold">Checkout fails after I add a coupon</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">Safari 18 · /checkout · screenshot added</p>
            </div>
          </div>

          <div className="py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Send it where work happens</p>
            <div className="mt-4 divide-y divide-white/[0.08] border-y border-white/10">
              {destinations.map(({ label, detail, Icon, tone }, index) => (
                <div key={label} className="landing-connection-destination flex items-center gap-3 py-3.5">
                  <Icon className={`h-4 w-4 shrink-0 ${tone}`} />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="ml-auto text-[11px] text-zinc-400">{detail}</span>
                  {index < 2 && <Check className="h-3.5 w-3.5 text-lime-300" />}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] leading-5 text-zinc-400">Choose what gets sent. Check delivery history and replay a failed send from the dashboard.</p>
        </div>

        <div className="grid sm:grid-rows-2">
          <div className="landing-connection-agent border-b border-white/10 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-lime-300" />
              <div>
                <p className="text-sm font-semibold">Let coding agents use the feedback</p>
                <p className="mt-1 text-xs text-zinc-400">Connect trusted tools with the API or MCP.</p>
              </div>
            </div>
            <div className="mt-5 border border-white/10 bg-black/25 p-4 font-mono text-[10px] leading-5 text-zinc-400">
              <p><span className="text-lime-300">agent</span> list unread bugs for checkout</p>
              <p className="mt-2 text-zinc-200">3 bugs found · only this project · your secret stays private</p>
            </div>
          </div>

          <div className="landing-connection-board p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-lime-300" />
              <div>
                <p className="text-sm font-semibold">Give users a public ideas page</p>
                <p className="mt-1 text-xs text-zinc-400">They can post, vote, follow, and read your reply.</p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-white/[0.08] border-y border-white/10">
              <div className="flex items-center gap-3 py-3 text-xs"><span className="font-mono text-lime-300">24</span><span className="font-medium">Add saved report views</span><span className="ml-auto text-[10px] text-sky-300">Planned</span></div>
              <div className="flex items-center gap-3 py-3 text-xs"><span className="font-mono text-zinc-400">11</span><span className="font-medium">Faster CSV exports</span><span className="ml-auto text-[10px] text-lime-300">Shipped</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
