import { describe, it, expect } from 'vitest'
import {
  INTERNAL_SOURCE_ID,
  sourceIdOf,
  isEventVisible,
  eventMatchesSearch,
} from '@entities/calendar/helpers/filters'

const displayGoogle = { source: 'google', sourceAccountId: 'acc-1', title: 'Standup' } as const
const displayInternal = { source: 'internal', sourceAccountId: 'internal_u1', title: 'Gym' } as const
const rowGoogle = { is_internal: false, google_account_id: 'acc-2', title: 'Review' }
const rowInternal = { is_internal: true, google_account_id: null, title: 'Note to self' }

describe('sourceIdOf', () => {
  it('returns the account id for google events', () => {
    expect(sourceIdOf(displayGoogle)).toBe('acc-1')
    expect(sourceIdOf(rowGoogle)).toBe('acc-2')
  })

  it('returns "internal" for own events', () => {
    expect(sourceIdOf(displayInternal)).toBe(INTERNAL_SOURCE_ID)
    expect(sourceIdOf(rowInternal)).toBe(INTERNAL_SOURCE_ID)
  })
})

describe('isEventVisible', () => {
  it('shows everything when nothing is hidden', () => {
    expect(isEventVisible(displayGoogle, [])).toBe(true)
  })

  it('hides events of a hidden source only', () => {
    expect(isEventVisible(displayGoogle, ['acc-1'])).toBe(false)
    expect(isEventVisible(rowGoogle, ['acc-1'])).toBe(true)
    expect(isEventVisible(rowInternal, ['internal'])).toBe(false)
  })
})

describe('eventMatchesSearch', () => {
  const event = { title: 'Weekly Sync', description: 'Roadmap talk', location: 'Room 4' }

  it('matches title, description and location case-insensitively', () => {
    expect(eventMatchesSearch(event, 'weekly', '')).toBe(true)
    expect(eventMatchesSearch(event, 'ROADMAP', '')).toBe(true)
    expect(eventMatchesSearch(event, 'room', '')).toBe(true)
  })

  it('matches the account name', () => {
    expect(eventMatchesSearch(event, 'acme', 'Acme Corp')).toBe(true)
    expect(eventMatchesSearch(event, 'acme', 'Other')).toBe(false)
  })

  it('trims the query', () => {
    expect(eventMatchesSearch(event, '  weekly  ', '')).toBe(true)
  })

  it('matches nothing for an empty query', () => {
    expect(eventMatchesSearch(event, '', 'Acme')).toBe(false)
    expect(eventMatchesSearch(event, '   ', 'Acme')).toBe(false)
  })

  it('copes with missing fields', () => {
    expect(eventMatchesSearch({ title: 'A' }, 'x', undefined)).toBe(false)
    expect(eventMatchesSearch({ title: null, description: null, location: null }, 'x', '')).toBe(false)
  })
})
