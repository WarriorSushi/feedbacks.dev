import postcss from 'postcss'

const MAX_CUSTOM_CSS_LENGTH = 6000
const FORBIDDEN_VALUE = /url\s*\(|expression\s*\(|javascript\s*:|data\s*:|@import|-moz-binding|behavior\s*:/i
const FORBIDDEN_PROPERTIES = new Set(['behavior', 'content', 'z-index'])

export function sanitizeCustomBoardCss(input: unknown): string | null {
  if (typeof input !== 'string' || !input.trim()) return null
  const source = input.trim()
  if (source.length > MAX_CUSTOM_CSS_LENGTH) {
    throw new Error(`Custom CSS must be ${MAX_CUSTOM_CSS_LENGTH} characters or fewer.`)
  }
  if (FORBIDDEN_VALUE.test(source)) {
    throw new Error('Custom CSS cannot load external resources or contain executable values.')
  }

  let root: postcss.Root
  try {
    root = postcss.parse(source)
  } catch {
    throw new Error('Custom CSS contains invalid syntax.')
  }

  root.walkAtRules(() => {
    throw new Error('Custom CSS at-rules are not supported.')
  })
  root.walkRules((rule) => {
    if (!rule.selectors?.length) throw new Error('Custom CSS requires an explicit selector.')
    rule.selectors = rule.selectors.map((selector) => {
      const normalized = selector.trim()
      if (!normalized || /:has\s*\(/i.test(normalized)) {
        throw new Error('Custom CSS contains an unsupported selector.')
      }
      if (/^(html|body|:root|\*)$/i.test(normalized)) return '[data-public-board]'
      return `[data-public-board] ${normalized}`
    })
  })
  root.walkDecls((declaration) => {
    const property = declaration.prop.trim().toLowerCase()
    const value = declaration.value.trim()
    if (FORBIDDEN_PROPERTIES.has(property) || FORBIDDEN_VALUE.test(value)) {
      throw new Error(`The ${property} declaration is not supported in custom CSS.`)
    }
    if (property === 'position' && /^(fixed|sticky)$/i.test(value)) {
      throw new Error(`The position: ${value} declaration is not supported in custom CSS.`)
    }
  })

  return root.toString()
}
