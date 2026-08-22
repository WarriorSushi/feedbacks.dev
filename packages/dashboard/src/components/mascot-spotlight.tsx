import Image from 'next/image'
import { cn } from '@/lib/utils'

export type MascotVariant =
  | 'early-adopter'
  | 'docs'
  | 'settings'
  | 'tour'
  | 'pro-for-free'
  | 'billing'

const mascotAssets: Record<MascotVariant, { src: string; width: number; height: number }> = {
  'early-adopter': { src: '/mascots-dashboard/early-adopter-host.png', width: 1122, height: 1402 },
  docs: { src: '/mascots-dashboard/docs-librarian.png', width: 1224, height: 1285 },
  settings: { src: '/mascots-dashboard/settings-mechanic.png', width: 1145, height: 1374 },
  tour: { src: '/mascots-dashboard/tour-navigator.png', width: 1212, height: 1298 },
  'pro-for-free': { src: '/mascots-dashboard/pro-for-free-gift.png', width: 1220, height: 1289 },
  billing: { src: '/mascots-dashboard/billing-concierge.png', width: 1173, height: 1341 },
}

export function MascotSpotlight({
  variant,
  className,
  sizes = '128px',
  priority = false,
}: {
  variant: MascotVariant
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const asset = mascotAssets[variant]

  return (
    <span className={cn('mascot-spotlight relative isolate block shrink-0', className)} aria-hidden="true">
      <span className="mascot-spotlight-glow pointer-events-none absolute inset-[24%] -z-10 rounded-full bg-primary/20 blur-2xl" />
      <Image
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        sizes={sizes}
        priority={priority}
        draggable={false}
        className="mascot-spotlight-image h-full w-full select-none object-contain drop-shadow-[0_16px_22px_rgb(0_0_0/0.2)]"
      />
    </span>
  )
}
