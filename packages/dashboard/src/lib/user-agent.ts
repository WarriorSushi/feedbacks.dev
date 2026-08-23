export type UserAgentSummary = {
  browser: string
  version: string | null
  operatingSystem: string
  architecture: string | null
  label: string
}

function matchVersion(userAgent: string, pattern: RegExp): string | null {
  return pattern.exec(userAgent)?.[1]?.split('.')[0] || null
}

function readBrowser(userAgent: string): Pick<UserAgentSummary, 'browser' | 'version'> {
  const edgeVersion = matchVersion(userAgent, /\bEdg(?:A|iOS)?\/([\d.]+)/)
  if (edgeVersion) return { browser: 'Microsoft Edge', version: edgeVersion }

  const operaVersion = matchVersion(userAgent, /\b(?:OPR|Opera)\/([\d.]+)/)
  if (operaVersion) return { browser: 'Opera', version: operaVersion }

  const chromeVersion = matchVersion(userAgent, /\b(?:Chrome|CriOS)\/([\d.]+)/)
  if (chromeVersion) return { browser: 'Google Chrome', version: chromeVersion }

  const firefoxVersion = matchVersion(userAgent, /\b(?:Firefox|FxiOS)\/([\d.]+)/)
  if (firefoxVersion) return { browser: 'Mozilla Firefox', version: firefoxVersion }

  const safariVersion = /\bSafari\//.test(userAgent)
    ? matchVersion(userAgent, /\bVersion\/([\d.]+)/)
    : null
  if (safariVersion) return { browser: 'Safari', version: safariVersion }

  return { browser: 'Unknown browser', version: null }
}

function readOperatingSystem(userAgent: string): string {
  if (/\bWindows NT 10\.0\b/.test(userAgent)) return 'Windows 10 or 11'
  if (/\bWindows NT 6\.3\b/.test(userAgent)) return 'Windows 8.1'
  if (/\bWindows NT 6\.1\b/.test(userAgent)) return 'Windows 7'
  if (/\b(?:iPhone|iPad|iPod)\b/.test(userAgent)) return 'iOS or iPadOS'

  const androidVersion = /\bAndroid ([\d.]+)/.exec(userAgent)?.[1]
  if (androidVersion) return `Android ${androidVersion.split('.')[0]}`

  const macVersion = /\bMac OS X ([\d_]+)/.exec(userAgent)?.[1]
  if (macVersion) return `macOS ${macVersion.replaceAll('_', '.')}`

  if (/\bLinux\b/.test(userAgent)) return 'Linux'
  return 'Unknown operating system'
}

export function summarizeUserAgent(userAgent: string): UserAgentSummary {
  const { browser, version } = readBrowser(userAgent)
  const operatingSystem = readOperatingSystem(userAgent)
  const architecture = /\b(?:Win64|x86_64|x64|amd64)\b/i.test(userAgent)
    ? '64-bit'
    : null
  const browserLabel = version ? `${browser} ${version}` : browser

  return {
    browser,
    version,
    operatingSystem,
    architecture,
    label: `${browserLabel} on ${operatingSystem}`,
  }
}
