declare module 'react' {
  export type ReactNode = unknown
  export type CSSProperties = Record<string, string | number | undefined>

  export interface HTMLAttributes<T> {
    className?: string
    style?: CSSProperties
    id?: string
    title?: string
    onClick?: (event: unknown) => void
    [key: string]: unknown
  }

  export function createElement(type: any, props?: any, ...children: any[]): any
  export const Fragment: unique symbol
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void
  export function useRef<T>(initialValue: T): { current: T }
  export function useId(): string
}
