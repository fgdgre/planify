import { describe, expect, it } from 'vitest'
import {
  createDemoAccounts,
  createDemoEvents,
  formatHour,
  hoursByDay,
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

describe('hoursByDay', () => {
  it('sums visible account hours per day', () => {
    expect(hoursByDay(createDemoEvents(), ['acme'])[0]).toEqual({ day: 0, total: 1.5, byAccount: { acme: 1.5 } })
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
