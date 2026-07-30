/**
 * Encodes one RFC 4180-compatible cell while preventing spreadsheet formula
 * execution. Quoting every value keeps delimiters, Unicode, and newlines safe.
 */
export function csvCell(value: unknown) {
  if (value == null) return ''
  let text = Array.isArray(value) ? value.join('; ') : String(value)
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
