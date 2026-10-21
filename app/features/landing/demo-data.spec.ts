import { describe, expect, it } from 'vitest'
import {
  createDemoAccounts,
  createDemoEvents,
  formatHour,
  DEMO_NOW_HOUR,
  DEMO_TODAY,
  countByDay,
  nextEventId,
  todaysSchedule,
  upcomingToday,
  validateEventDraft,
  layoutDay,
  matchesQuery,
  snapStart,
  type DemoEvent,
} from './demo-data'

function makeEvent(id: number, start: number, length: number): DemoEvent {
  return { id, title: `Event ${id}`, account: 'acme', day: 0, start, length, notes: [] }
}

describe('formatHour', () => {
  it('formats whole and half hours', () => {
    expect(formatHour(9)).toBe('9:00')
    expect(formatHour(13.5)).toBe('1:30')
    expect(formatHour(12)).toBe('12:00')
  })
})

describe('matchesQuery', () => {
  const accounts = createDemoAccounts()
  const events = createDemoEvents()
  const acme = accounts.find(a => a.id === 'acme')!
  const personal = accounts.find(a => a.id === 'personal')!
  const standup = events.find(e => e.title === 'Acme standup')!
  const dentist = events.find(e => e.title === 'Dentist')!

  it('matches title or account name case-insensitively', () => {
    expect(matchesQuery(standup, acme, 'ACME')).toBe(true)
    expect(matchesQuery(dentist, personal, 'dent')).toBe(true)
  })

  it('does not match other accounts', () => {
    expect(matchesQuery(dentist, personal, 'acme')).toBe(false)
  })

  it('returns false for an empty query', () => {
    expect(matchesQuery(standup, acme, '')).toBe(false)
  })
})

describe('layoutDay', () => {
  it('puts overlapping events side by side and others alone', () => {
    const result = layoutDay([makeEvent(1, 9, 1), makeEvent(2, 9.5, 1), makeEvent(3, 11, 1)])
    const byId = (id: number) => result.find(r => r.id === id)
    expect(byId(1)).toEqual({ id: 1, column: 0, columns: 2 })
    expect(byId(2)).toEqual({ id: 2, column: 1, columns: 2 })
    expect(byId(3)).toEqual({ id: 3, column: 0, columns: 1 })
  })
})

describe('snapStart', () => {
  it('rounds to half hours and clamps to the visible range', () => {
    expect(snapStart(9.2, 1)).toBe(9)
    expect(snapStart(9.3, 1)).toBe(9.5)
    expect(snapStart(8, 1)).toBe(9)
    expect(snapStart(15.8, 1.5)).toBe(14.5)
  })
})

describe('countByDay', () => {
  it('counts events per day for all accounts', () => {
    expect(countByDay(createDemoEvents(), ['acme', 'studio', 'personal', 'planify'])).toEqual([2, 3, 3, 2, 3])
  })

  it('counts only visible accounts', () => {
    expect(countByDay(createDemoEvents(), ['acme'])).toEqual([1, 0, 1, 1, 1])
    expect(countByDay(createDemoEvents(), [])).toEqual([0, 0, 0, 0, 0])
  })
})

describe('today helpers', () => {
  const all = ['acme', 'studio', 'personal', 'planify'] as const

  it('uses Wednesday 11:00 as now', () => {
    expect(DEMO_TODAY).toBe(2)
    expect(DEMO_NOW_HOUR).toBe(11)
  })

  it('lists upcoming events today sorted by start', () => {
    expect(upcomingToday(createDemoEvents(), [...all]).map(e => e.title)).toEqual(['Acme 1:1', 'Gym'])
    expect(upcomingToday(createDemoEvents(), ['personal']).map(e => e.title)).toEqual(['Gym'])
  })

  it('lists the whole schedule today sorted by start', () => {
    expect(todaysSchedule(createDemoEvents(), [...all]).map(e => e.title)).toEqual(['Studio review', 'Acme 1:1', 'Gym'])
    expect(todaysSchedule(createDemoEvents(), ['acme']).map(e => e.title)).toEqual(['Acme 1:1'])
  })
})

describe('validateEventDraft', () => {
  const ok = { title: 'Call', day: 1, start: 10, end: 11 }

  it('accepts a valid draft', () => {
    expect(validateEventDraft(ok)).toBeNull()
  })

  it('rejects an empty title', () => {
    expect(validateEventDraft({ ...ok, title: '   ' })).toBe('Add a title')
  })

  it('rejects an end that is not after the start', () => {
    expect(validateEventDraft({ ...ok, end: 10 })).toBe('End must be after start')
    expect(validateEventDraft({ ...ok, start: 12, end: 11 })).toBe('End must be after start')
  })

  it('rejects times outside the visible range', () => {
    expect(validateEventDraft({ ...ok, start: 8, end: 9 })).toBe('Pick a time between 9 am and 4 pm')
    expect(validateEventDraft({ ...ok, start: 15, end: 16.5 })).toBe('Pick a time between 9 am and 4 pm')
  })
})

describe('nextEventId', () => {
  it('returns max id + 1, or 1 when empty', () => {
    expect(nextEventId(createDemoEvents())).toBe(14)
    expect(nextEventId([])).toBe(1)
  })
})

describe('createDemoEvents', () => {
  it('returns 13 fresh copies on every call', () => {
    const first = createDemoEvents()
    expect(first).toHaveLength(13)
    first[0]!.title = 'Changed'
    first[0]!.notes.push({ title: 'x', body: 'y' })
    const second = createDemoEvents()
    expect(second[0]!.title).toBe('Acme standup')
    expect(second[0]!.notes).toHaveLength(2)
  })
})
