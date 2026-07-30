import { ImageResponse } from 'next/og'

export const alt = 'feedbacks.dev — collect feedback and show users what shipped'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#f5f7f0',
          color: '#171914',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          padding: '68px',
          width: '100%',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '2px solid #d9ded0',
            borderRadius: '28px',
            boxShadow: '0 32px 90px rgba(24, 28, 20, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
            padding: '58px 64px',
            width: '100%',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', fontSize: 32, fontWeight: 700 }}>
            <div
              style={{
                alignItems: 'center',
                background: '#171914',
                borderRadius: '10px',
                color: '#9bd60b',
                display: 'flex',
                height: 42,
                justifyContent: 'center',
                marginRight: 16,
                width: 42,
              }}
            >
              f
            </div>
            feedbacks<span style={{ color: '#70a000' }}>.dev</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#70a000', display: 'flex', fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
              FEEDBACK AND UPDATES INSIDE YOUR APP
            </div>
            <div style={{ display: 'flex', fontSize: 68, fontWeight: 750, letterSpacing: -3, lineHeight: 1.05, marginTop: 20 }}>
              Find what users need.
            </div>
            <div style={{ display: 'flex', fontSize: 68, fontWeight: 750, letterSpacing: -3, lineHeight: 1.05 }}>
              Show what you fixed.
            </div>
            <div style={{ color: '#606659', display: 'flex', fontSize: 27, lineHeight: 1.4, marginTop: 26 }}>
              One lightweight embed. A useful inbox. Product updates users can see.
            </div>
          </div>

          <div style={{ color: '#606659', display: 'flex', fontSize: 22 }}>
            Install in minutes · Start free · Manage remotely
          </div>
        </div>
      </div>
    ),
    size,
  )
}
