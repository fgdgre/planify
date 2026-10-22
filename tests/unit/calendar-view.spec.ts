import { describe, expect, it, vi } from 'vitest'
import { showWeekView } from '@entities/calendar/helpers/view'

const date = { toString: () => '2026-10-22' } as unknown as Temporal.PlainDate

describe('showWeekView', () => {
  it('switches the internal state to the week view on the given date', () => {
    const setView = vi.fn()

    showWeekView({ $app: { calendarState: { setView } } }, date)

    expect(setView).toHaveBeenCalledWith('week', date)
  })

  it.each([
    ['no internal app', {}],
    ['no calendar state', { $app: {} }],
    ['no setView', { $app: { calendarState: {} } }],
  ])('throws instead of doing nothing when there is %s', (_, app) => {
    expect(() => showWeekView(app, date)).toThrow(/Schedule-X internals changed/)
  })
})
