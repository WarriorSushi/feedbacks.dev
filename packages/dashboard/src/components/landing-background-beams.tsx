import { cn } from '@/lib/utils'

const beamPaths = Array.from({ length: 18 }, (_, index) => {
  const startX = -520 + index * 92
  const firstX = -160 + index * 76
  const secondX = 540 + index * 48
  const endX = 1130 + index * 64
  const bend = (index % 4) * 18

  return `M ${startX} -180 C ${firstX} ${130 + bend}, ${secondX} ${230 - bend}, ${endX} 1080`
})

export function LandingBackgroundBeams({ className }: { className?: string }) {
  return (
    <div className={cn('landing-background-beams', className)} aria-hidden="true">
      <span className="landing-beam-bloom landing-beam-bloom-primary" />
      <span className="landing-beam-bloom landing-beam-bloom-cyan" />
      <span className="landing-beam-bloom landing-beam-bloom-violet" />
      <svg viewBox="0 0 1440 900" fill="none" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="landing-beam-base" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.44" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="landing-beam-energy" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#a3e635" stopOpacity="0" />
            <stop offset="0.32" stopColor="#a3e635" stopOpacity="0.92" />
            <stop offset="0.56" stopColor="#22d3ee" stopOpacity="0.74" />
            <stop offset="0.78" stopColor="#8b5cf6" stopOpacity="0.58" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <filter id="landing-beam-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        <g className="landing-beam-base-paths">
          {beamPaths.map((path, index) => <path key={`base-${index}`} d={path} pathLength="1" />)}
        </g>
        <g className="landing-beam-energy-paths" filter="url(#landing-beam-soft-glow)">
          {beamPaths.filter((_, index) => index % 2 === 0).map((path, index) => (
            <path
              key={`energy-${index}`}
              d={path}
              pathLength="1"
              style={{ animationDelay: `${index * -1.7}s`, animationDuration: `${17 + (index % 3) * 3}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  )
}
