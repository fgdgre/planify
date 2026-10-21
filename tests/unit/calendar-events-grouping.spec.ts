import { describe, it, expect } from 'vitest'
import { groupEventsBySource, internalSourceKey } from '@entities/calendar/helpers/events'

const internal = (id: string, userId = 'user-1') => ({
  id,
  user_id: userId,
  google_account_id: null,
  is_internal: true,
})

const google = (id: string, accountId: string, userId = 'user-1') => ({
  id,
  user_id: userId,
  google_account_id: accountId,
  is_internal: false,
})

describe('internalSourceKey', () => {
  it('matches the key the calendar uses for internal events', () => {
    expect(internalSourceKey('user-1')).toBe('internal_user-1')
  })
})

describe('groupEventsBySource', () => {
  it('returns an empty map for no rows', () => {
    expect(groupEventsBySource([])).toEqual({})
  })

  it('groups internal events under the internal key of their owner', () => {
    const rows = [internal('e1'), internal('e2')]

    expect(groupEventsBySource(rows)).toEqual({
      'internal_user-1': rows,
    })
  })

  it('groups google events under their google account id', () => {
    const a1 = google('e1', 'acc-a')
    const b1 = google('e2', 'acc-b')
    const a2 = google('e3', 'acc-a')

    expect(groupEventsBySource([a1, b1, a2])).toEqual({
      'acc-a': [a1, a2],
      'acc-b': [b1],
    })
  })

  it('keeps internal and google events in separate groups', () => {
    const i1 = internal('e1')
    const g1 = google('e2', 'acc-a')

    expect(groupEventsBySource([i1, g1])).toEqual({
      'internal_user-1': [i1],
      'acc-a': [g1],
    })
  })

  it('preserves the input order inside each group', () => {
    const rows = [google('e3', 'acc-a'), google('e1', 'acc-a'), google('e2', 'acc-a')]

    expect(groupEventsBySource(rows)['acc-a']?.map((e) => e.id)).toEqual(['e3', 'e1', 'e2'])
  })

  it('drops rows that are neither internal nor attached to a google account', () => {
    const orphan = { id: 'x', user_id: 'user-1', google_account_id: null, is_internal: false }

    expect(groupEventsBySource([orphan, internal('e1')])).toEqual({
      'internal_user-1': [internal('e1')],
    })
  })
})
