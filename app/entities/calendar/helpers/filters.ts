/** Source id used for Planify's own (non-Google) events. */
export const INTERNAL_SOURCE_ID = 'internal'

// Events come in two shapes: calendar_events rows and the display events built from them.
type SourceFields =
  | { is_internal: boolean; google_account_id: string | null }
  | { source: 'internal' | 'google'; sourceAccountId?: string }

interface SearchFields {
  title?: string | null
  description?: string | null
  location?: string | null
}

export const sourceIdOf = (event: SourceFields): string => {
  if ('is_internal' in event) {
    return event.is_internal ? INTERNAL_SOURCE_ID : event.google_account_id ?? ''
  }

  return event.source === 'internal' ? INTERNAL_SOURCE_ID : event.sourceAccountId ?? ''
}

export const isEventVisible = (event: SourceFields, hiddenSources: string[]): boolean => {
  return !hiddenSources.includes(sourceIdOf(event))
}

export const eventMatchesSearch = (
  event: SearchFields,
  query: string,
  accountName: string | undefined,
): boolean => {
  const q = query.trim().toLowerCase()
  if (!q) return false

  const fields = [event.title, event.description, event.location, accountName]
  return fields.some((field) => field?.toLowerCase().includes(q))
}
