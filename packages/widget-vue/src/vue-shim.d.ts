declare module 'vue' {
  export type PropType<T> = unknown
  export type StyleValue = string | Record<string, unknown> | Array<string | Record<string, unknown>>

  export type ComponentPublicInstance = unknown
  export type VNodeChild = unknown

  export function computed<T>(getter: () => T): { value: T }
  export function defineComponent(options: any): any
  export function h(type: any, props?: any, children?: any): any
  export function onBeforeUnmount(callback: () => void): void
  export function onMounted(callback: () => void): void
  export function ref<T>(value: T): { value: T }
  export function watch(
    source: () => unknown,
    callback: () => void,
    options?: { immediate?: boolean; flush?: 'pre' | 'post' | 'sync' }
  ): void
}
