interface EventSourceFields {
  user_id: string
  google_account_id: string | null
  is_internal: boolean
}

/** Store key under which a user's internal (non-Google) events are kept. */
export const internalSourceKey = (userId: string) => `internal_${userId}`

/**
 * Splits one `calendar_events` result set into the per-source map the
 * google-calendar store expects: `internal_<userId>` for internal events and
 * the google account id for synced ones. Rows with no source are dropped.
 */
export const groupEventsBySource = <T extends EventSourceFields>(rows: T[]): Record<string, T[]> => {
  const groups: Record<string, T[]> = {}

  for (const row of rows) {
    const key = row.is_internal
      ? internalSourceKey(row.user_id)
      : row.google_account_id

    if (!key) continue

    ;(groups[key] ??= []).push(row)
  }

  return groups
}
