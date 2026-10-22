import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTourDirector } from '@features/demo-tour/director'
import type { TourEnv } from '@features/demo-tour/steps'
import type { CalendarEventDisplay, EventSidebarControls } from '@entities/calendar'
import { __resetDemoModeForTests, type DemoMessageBody } from '@shared/api/demo'

const landing = (extra: object) => ({ source: 'planify-landing', version: 1, ...extra })

const NOW = new Date(2026, 9, 22, 10, 30)
const iso = (hour: number, day = 22) => new Date(2026, 9, day, hour).toISOString()

const event = (id: string, title: string, start_at: string): CalendarEventDisplay => ({
  id, title, start_at, end_at: start_at, all_day: false, source: 'internal',
})

const standup = event('s1', 'Acme standup', iso(9, 19))
const clientCall = event('c1', 'Client call', iso(14))

function setup({ events = [standup], reducedMotion = true } = {}) {
  const sent: DemoMessageBody[] = []
  const typedTitles: string[] = []
  const searchQueries: string[] = []
  const viewRange = { start: new Date(2026, 9, 19).toISOString(), end: new Date(2026, 9, 26).toISOString() }
  const navigations: Array<{ path: string; query?: Record<string, string> }> = []
  const note = { id: 'n1', title: 'Acme standup notes' }

  const sidebar = {
    mode: null as EventSidebarControls['mode'],
    selectedEvent: null as CalendarEventDisplay | null,
    eventNotes: [] as unknown[],
    saving: false,
    setTitle: vi.fn((title: string) => typedTitles.push(title)),
    submit: vi.fn(async () => { sidebar.mode = 'view'; sidebar.selectedEvent = event('new', 'Client call', iso(14)) }),
    openNote: vi.fn(async () => {}),
  }
  const calendar = { showCurrentWeek: vi.fn() }

  // The router drives the (fake) sidebar the way the real route watcher does.
  const navigate = vi.fn(async (location: { path: string; query?: Record<string, string> }) => {
    navigations.push(location)
    const query = location.query ?? {}
    if (query.action === 'create') sidebar.mode = 'create'
    else if (query.eventId) {
      sidebar.mode = 'view'
      sidebar.selectedEvent = events.find((e) => e.id === query.eventId) ?? null
      sidebar.eventNotes = [note]
    } else sidebar.mode = null
  })

  const director = createTourDirector({
    send: (body) => sent.push(body),
    createEnv: (signal): TourEnv => ({
      navigate,
      currentPath: () => '/demo/calendar',
      calendar: () => calendar,
      eventSidebar: () => sidebar as unknown as EventSidebarControls,
      events: () => events,
      viewRange: () => viewRange,
      searchBox: () => ({ setQuery: (value) => searchQueries.push(value) }),
      now: () => NOW,
      reducedMotion,
      signal,
    }),
  })

  const step = (n: number) => director.handleLandingMessage(landing({ type: 'step', step: n }))
  const types = () => sent.map((m) => m.type)

  return { director, step, sent, types, typedTitles, searchQueries, navigations, sidebar, calendar, note }
}

beforeEach(() => {
  vi.useFakeTimers()
  window.history.pushState({}, '', '/demo/calendar')
  __resetDemoModeForTests()
})

afterEach(() => {
  vi.useRealTimers()
  window.history.pushState({}, '', '/')
  __resetDemoModeForTests()
})

describe('tour steps', () => {
  it('step 1 shows the current week', async () => {
    const { step, calendar, sent } = setup()
    step(1)
    await vi.runAllTimersAsync()

    expect(calendar.showCurrentWeek).toHaveBeenCalled()
    expect(sent).toEqual([{ type: 'step-done', step: 1 }])
  })

  it('step 2 creates today\'s 14:00 event through the create sidebar', async () => {
    const { step, navigations, typedTitles, sidebar, sent } = setup()
    step(2)
    await vi.runAllTimersAsync()

    const create = navigations.find((n) => n.query?.action === 'create')!
    expect(create.path).toBe('/demo/calendar')
    expect(create.query).toMatchObject({ eventStart: iso(14), eventEnd: iso(15), eventAllDay: 'false' })
    expect(typedTitles).toEqual(['Client call'])
    expect(sidebar.submit).toHaveBeenCalledTimes(1)
    expect(sent).toEqual([{ type: 'step-done', step: 2 }])
  })

  it('step 2 only opens the event when today\'s Client call already exists', async () => {
    const { step, navigations, sidebar, sent } = setup({ events: [standup, clientCall] })
    step(2)
    await vi.runAllTimersAsync()

    expect(sidebar.submit).not.toHaveBeenCalled()
    expect(navigations.at(-1)).toEqual({ path: '/demo/calendar', query: { eventId: 'c1' } })
    expect(sent).toEqual([{ type: 'step-done', step: 2 }])
  })

  it('step 2 types the title one character at a time unless motion is reduced', async () => {
    const { step, typedTitles } = setup({ reducedMotion: false })
    step(2)
    await vi.runAllTimersAsync()

    expect(typedTitles).toHaveLength('Client call'.length)
    expect(typedTitles[0]).toBe('C')
    expect(typedTitles.at(-1)).toBe('Client call')
  })

  it('step 3 opens the first Acme standup and its first note', async () => {
    const later = event('s2', 'Acme standup', iso(9, 20))
    const { step, navigations, sidebar, note, sent } = setup({ events: [later, standup] })
    step(3)
    await vi.runAllTimersAsync()

    expect(navigations.at(-1)).toEqual({ path: '/demo/calendar', query: { eventId: 's1' } })
    expect(sidebar.openNote).toHaveBeenCalledWith(note)
    expect(sent).toEqual([{ type: 'step-done', step: 3 }])
  })

  it('step 4 fills the calendar search with "acme"', async () => {
    const { step, searchQueries, sent } = setup()
    step(4)
    await vi.runAllTimersAsync()

    expect(searchQueries.at(-1)).toBe('acme')
    expect(sent).toEqual([{ type: 'step-done', step: 4 }])
  })

  it('step 5 goes to the dashboard and clears the search', async () => {
    const { step, navigations, searchQueries } = setup()
    step(5)
    await vi.runAllTimersAsync()

    expect(navigations.at(-1)).toEqual({ path: '/demo', query: {} })
    expect(searchQueries.at(-1)).toBe('')
  })
})

describe('failures', () => {
  it('reports step-failed instead of throwing when a step cannot run', async () => {
    const { step, sent } = setup({ events: [clientCall] })
    step(3)
    await vi.runAllTimersAsync()

    expect(sent).toEqual([{ type: 'step-failed', step: 3, reason: 'No "Acme standup" event found' }])
  })

  it('reports a timeout when the app never gets ready', async () => {
    const { step, sent } = setup({ events: [] })
    step(2)
    await vi.runAllTimersAsync()

    expect(sent).toEqual([{ type: 'step-failed', step: 2, reason: 'Timed out waiting for calendar events' }])
  })
})

describe('visitor control', () => {
  it('stops the running step and reports it once', async () => {
    const { director, step, types, typedTitles } = setup({ reducedMotion: false })
    step(2)
    await vi.advanceTimersByTimeAsync(250)
    director.takeControlFromTour()
    director.takeControlFromTour()
    await vi.runAllTimersAsync()

    expect(types()).toEqual(['user-took-control'])
    expect(typedTitles.at(-1)).not.toBe('Client call')
  })

  it('ignores steps until resume', async () => {
    const { director, step, handle, types } = (() => {
      const s = setup()
      return { ...s, handle: s.director.handleLandingMessage }
    })()

    director.takeControlFromTour()
    step(1)
    await vi.runAllTimersAsync()
    expect(types()).toEqual(['user-took-control', 'step-ignored'])

    handle(landing({ type: 'resume' }))
    step(1)
    await vi.runAllTimersAsync()
    expect(types()).toEqual(['user-took-control', 'step-ignored', 'step-done'])
  })

  it('reports control again after a resume', () => {
    const { director, types } = setup()
    director.takeControlFromTour()
    director.handleLandingMessage(landing({ type: 'resume' }))
    director.takeControlFromTour()

    expect(types()).toEqual(['user-took-control', 'user-took-control'])
  })

  it('a newer step replaces the one in progress without reporting an error', async () => {
    const { step, types, searchQueries } = setup({ reducedMotion: false })
    step(4)
    await vi.advanceTimersByTimeAsync(100)
    step(5)
    await vi.runAllTimersAsync()

    expect(types()).toEqual(['step-done'])
    expect(searchQueries.at(-1)).toBe('')
  })
})

describe('untrusted input', () => {
  it('ignores malformed messages', async () => {
    const { director, types } = setup()
    for (const data of [null, 'x', { type: 'step', step: 1 }, landing({ type: 'step', step: 9 }), landing({ type: 'boom' })]) {
      director.handleLandingMessage(data)
    }
    await vi.runAllTimersAsync()

    expect(types()).toEqual([])
  })

  it('announces itself as ready', () => {
    const { director, sent } = setup()
    director.reportReady()

    expect(sent).toEqual([{ type: 'ready' }])
  })
})

describe('range awareness', () => {
  it('does not treat events outside the shown week as ready', async () => {
    const { step, sent } = setup({ events: [event('old', 'Acme standup', iso(9, 5))] })
    step(3)
    await vi.runAllTimersAsync()

    expect(sent).toEqual([{ type: 'step-failed', step: 3, reason: 'Timed out waiting for calendar events' }])
  })
})
