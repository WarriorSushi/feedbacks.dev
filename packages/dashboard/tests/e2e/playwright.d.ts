declare module '@playwright/test' {
  export interface Request {
    method(): string
  }

  export interface Response {
    url(): string
    status(): number
    request(): Request
  }

  export interface PageRequest {
    get(url: string, options?: unknown): Promise<{
      ok(): boolean
      status(): number
      json(): Promise<any>
    }>
    post(url: string, options?: { data?: unknown; headers?: Record<string, string> }): Promise<{
      ok(): boolean
      status(): number
      json(): Promise<any>
    }>
    put(url: string, options?: { data?: unknown; headers?: Record<string, string> }): Promise<{
      ok(): boolean
      status(): number
      json(): Promise<any>
    }>
    fetch(url: string, options?: { method?: string; data?: unknown; headers?: Record<string, string> }): Promise<{
      ok(): boolean
      status(): number
      json(): Promise<any>
    }>
  }

  export interface Locator {
    click(options?: unknown): Promise<void>
    fill(value: string): Promise<void>
    toBeVisible(): Promise<void>
    selectOption(value: string): Promise<void>
    getByRole(role: string, options?: { name?: string | RegExp; exact?: boolean }): Locator
    getByLabel(label: string | RegExp): Locator
    first(): Locator
    nth(index: number): Locator
  }

  export interface Page {
    goto(url: string, options?: unknown): Promise<void>
    evaluate<T>(pageFunction: (...args: any[]) => T | Promise<T>, arg?: unknown): Promise<T>
    getByRole(role: string, options?: { name?: string | RegExp; exact?: boolean }): Locator
    getByLabel(label: string | RegExp): Locator
    getByText(text: string | RegExp): Locator
    locator(selector: string): Locator
    request: PageRequest
    waitForResponse(predicate: (response: Response) => boolean | Promise<boolean>): Promise<Response>
    waitForURL(url: string | RegExp): Promise<void>
    reload(options?: unknown): Promise<void>
  }

  export interface TestFn {
    (name: string, fn: (args: { page: Page }) => Promise<void>): void
    skip(condition: boolean, description?: string): void
    describe: {
      (name: string, fn: () => void): void
      skip(condition: boolean, description?: string): void
      configure(options: unknown): void
    }
  }

  export const test: TestFn
  export const expect: any
  export const devices: Record<string, any>
  export function defineConfig(config: any): any
}
