interface SuggestionSource {
  id: string
  message: string
  status: string
  vote_count: number
}

export interface BoardSuggestionEntry {
  id: string
  title: string
  description: string
  status: string
  vote_count: number
}

export function normalizeBoardMessageTitle(message: string): string {
  return message
    .split('\n')[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

export function isLikelySpam(message: string): boolean {
  const trimmed = message.trim()
  const urlCount = (trimmed.match(/https?:\/\//gi) || []).length
  const repeatedChars = /(.)\1{7,}/.test(trimmed)
  const shouty = trimmed.length > 24 && trimmed === trimmed.toUpperCase()
  return urlCount > 2 || repeatedChars || shouty
}

export function scoreSuggestion(query: string, candidate: string): number {
  const normalizedQuery = normalizeBoardMessageTitle(query)
  const normalizedCandidate = normalizeBoardMessageTitle(candidate)

  if (!normalizedQuery || !normalizedCandidate) return 0
  if (normalizedQuery === normalizedCandidate) return 100
  if (normalizedCandidate.includes(normalizedQuery) || normalizedQuery.includes(normalizedCandidate)) return 70

  const queryWords = new Set(normalizedQuery.split(' '))
  const candidateWords = new Set(normalizedCandidate.split(' '))
  let overlap = 0
  queryWords.forEach((word) => {
    if (candidateWords.has(word)) overlap += 1
  })

  return overlap * 15
}

export function buildSuggestionEntries(
  query: string,
  rows: SuggestionSource[],
  limit = 5,
): BoardSuggestionEntry[] {
  return rows
    .map((row) => {
      const score = scoreSuggestion(query, row.message)
      const lines = row.message.split('\n')
      const title = lines[0]
      const description = lines.slice(1).join(' ').trim()
      return {
        id: row.id,
        title: title.length > 88 ? `${title.slice(0, 88)}…` : title,
        description: description.length > 160 ? `${description.slice(0, 160)}…` : description,
        status: row.status,
        vote_count: row.vote_count,
        score,
      }
    })
    .filter((row) => row.score >= 25)
    .sort((a, b) => b.score - a.score || b.vote_count - a.vote_count)
    .slice(0, limit)
    .map(({ score: _score, ...rest }) => rest)
}
