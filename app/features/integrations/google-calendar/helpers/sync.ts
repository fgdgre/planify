/**
 * How long a Google account's cached events are considered fresh before the
 * client asks the `google-sync-events` edge function to pull from Google again.
 * The manual refresh button bypasses this window.
 */
export const SYNC_TTL_MS = 5 * 60 * 1000

export const isSyncStale = (
  lastSyncedAt: number | undefined,
  now: number,
  ttlMs: number = SYNC_TTL_MS,
): boolean => {
  if (lastSyncedAt === undefined) return true

  return now - lastSyncedAt >= ttlMs
}

export const pickStaleAccountIds = (
  accountIds: string[],
  syncedAt: Record<string, number | undefined>,
  now: number,
  options: { force?: boolean; ttlMs?: number } = {},
): string[] => {
  if (options.force) return [...accountIds]

  return accountIds.filter((id) => isSyncStale(syncedAt[id], now, options.ttlMs))
}
