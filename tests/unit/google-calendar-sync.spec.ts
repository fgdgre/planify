import { describe, it, expect } from 'vitest'
import {
  SYNC_TTL_MS,
  isSyncStale,
  pickStaleAccountIds,
} from '@features/integrations/google-calendar/helpers/sync'

describe('isSyncStale', () => {
  it('treats an account that has never synced as stale', () => {
    expect(isSyncStale(undefined, 1_000_000)).toBe(true)
  })

  it('is fresh right after a sync', () => {
    expect(isSyncStale(1_000_000, 1_000_000 + 1_000)).toBe(false)
  })

  it('is fresh one millisecond before the ttl elapses', () => {
    expect(isSyncStale(0, SYNC_TTL_MS - 1)).toBe(false)
  })

  it('is stale once the ttl has elapsed', () => {
    expect(isSyncStale(0, SYNC_TTL_MS)).toBe(true)
  })

  it('accepts a custom ttl', () => {
    expect(isSyncStale(0, 10, 5)).toBe(true)
    expect(isSyncStale(0, 4, 5)).toBe(false)
  })
})

describe('pickStaleAccountIds', () => {
  const now = 10_000_000

  it('returns only accounts whose last sync is older than the ttl', () => {
    const syncedAt = {
      fresh: now - 1_000,
      old: now - SYNC_TTL_MS - 1,
    }

    expect(pickStaleAccountIds(['fresh', 'old', 'never'], syncedAt, now)).toEqual(['old', 'never'])
  })

  it('returns every account when forced', () => {
    const syncedAt = { a: now, b: now }

    expect(pickStaleAccountIds(['a', 'b'], syncedAt, now, { force: true })).toEqual(['a', 'b'])
  })

  it('returns an empty list when there are no accounts', () => {
    expect(pickStaleAccountIds([], {}, now)).toEqual([])
  })

  it('preserves the input order', () => {
    expect(pickStaleAccountIds(['b', 'a'], {}, now)).toEqual(['b', 'a'])
  })
})
