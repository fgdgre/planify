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

/** Fake elements the tour can point at; `getBoundingClientRect` is all the choreography reads. */
const fakeElement = (name: string) => {
  const el = document.createElement('div')
  el.dataset.name = name
  el.getBoundingClientRect = () => ({ left: 100, top: 100, width: 40, height: 20, right: 140, bottom: 120, x: 100, y: 100, toJSON: () => ({}) })
  return el
}

function setup({ events = [standup], reducedMotion = true, withTargets = true } = {}) {
  /** Everything visible or audible about a step, in order, with the fake clock at the time it happened. */
  const log: string[] = []
  const timeline: Array<{ entry: string; at: number }> = []
  const startedAt = Date.now()
  const mark = (entry: string) => {
    log.push(entry)
    timeline.push({ entry, at: Date.now() - startedAt })
  }
  const sent: DemoMessageBody[] = []
  const typedTitles: string[] = []
  const targetElements = Object.fromEntries(
    ['calendarGrid', 'searchBox', 'searchResults', 'sidebarSubmit', 'eventNotes', 'dashboardNav', 'statsRow', 'pageContent'].map((name) => [name, fakeElement(name)]),
  )
  const searchQueries: string[] = []
  const viewRange = { start: new Date(2026, 9, 19).toISOString(), end: new Date(2026, 9, 26).toISOString() }
  const navigations: Array<{ path: string; query?: Record<string, string> }> = []
  const note = { id: 'n1', title: 'Acme standup notes' }
  let createdCount = 0
  let currentPath = '/demo/calendar'
  // Own copy, so tests can add visitor events and the fake sidebar can create and delete.
  events = [...events]

  const sidebar = {
    mode: null as EventSidebarControls['mode'],
    selectedEvent: null as CalendarEventDisplay | null,
    eventNotes: [] as unknown[],
    saving: false,
    setTitle: vi.fn((title: string) => { typedTitles.push(title); mark(`type:${title}`) }),
    submit: vi.fn(async () => {
      mark('save')
      const created = event(`new${++createdCount}`, 'Client call', iso(14))
      events.push(created)
      sidebar.mode = 'view'
      sidebar.selectedEvent = created
    }),
    openNote: vi.fn(async () => { mark('open-note') }),
    deleteEvent: vi.fn(async (id: string) => {
      mark(`delete:${id}`)
      const index = events.findIndex((e) => e.id === id)
      if (index >= 0) events.splice(index, 1)
      return true
    }),
  }
  const calendar = {
    showCurrentWeek: vi.fn(),
    slotPoint: vi.fn(() => ({ x: 300, y: 400 })),
    eventElement: vi.fn((id: string) => fakeElement(`event:${id}`)),
  }
  const visuals = {
    moveCursorTo: vi.fn((point: { x: number; y: number }) => mark(`cursor:${point.x},${point.y}`)),
    ripple: vi.fn(() => mark('ripple')),
    glow: vi.fn((el: HTMLElement) => mark(`glow:${el.dataset.name}`)),
    clearGlow: vi.fn(() => mark('clear-glow')),
    pulse: vi.fn((el: HTMLElement) => mark(`pulse:${el.dataset.name}`)),
    fadeContent: vi.fn((el: HTMLElement, visible: boolean) => mark(`fade:${el.dataset.name}:${visible ? 'in' : 'out'}`)),
    hide: vi.fn(() => mark('hide')),
  }

  // The router drives the (fake) sidebar the way the real route watcher does.
  const navigate = vi.fn(async (location: { path: string; query?: Record<string, string> }) => {
    navigations.push(location)
    currentPath = location.path
    mark(`navigate:${location.query?.action ?? (location.query?.eventId ? 'event' : location.path)}`)
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
    onTakeControl: () => visuals.hide(),
    createEnv: (signal): TourEnv => ({
      navigate,
      currentPath: () => currentPath,
      calendar: () => calendar,
      eventSidebar: () => sidebar as unknown as EventSidebarControls,
      events: () => events,
      viewRange: () => viewRange,
      searchBox: () => ({ setQuery: (value) => { searchQueries.push(value); if (value) mark(`search:${value}`) } }),
      target: (name) => (withTargets ? targetElements[name] ?? null : null),
      visuals,
      now: () => NOW,
      reducedMotion,
      signal,
    }),
  })

  const step = (n: number) => director.handleLandingMessage(landing({ type: 'step', step: n }))
  const types = () => sent.map((m) => m.type)

  return { director, step, events, sent, types, typedTitles, searchQueries, navigations, sidebar, calendar, note, visuals, log, timeline }
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

  it('step 2 never takes a shortcut: it creates the event even when one already exists', async () => {
    const { step, sidebar, sent } = setup({ events: [standup, clientCall] })
    step(2)
    await vi.runAllTimersAsync()

    expect(sidebar.submit).toHaveBeenCalledTimes(1)
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

    expect(navigations.some((n) => n.query?.eventId === 's1')).toBe(true)
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

  it('hands control over when the landing says the visitor chose to take it', async () => {
    const { director, step, types } = setup()

    director.handleLandingMessage(landing({ type: 'take-control' }))
    step(1)
    await vi.runAllTimersAsync()

    expect(types()).toEqual(['user-took-control', 'step-ignored'])
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

describe('choreography', () => {
  /** Typing is checked on its own; here only its first and last keystroke matter. */
  const withoutKeystrokes = (log: string[]) => log.filter((entry) => !entry.startsWith('type:') || entry === 'type:C' || entry === 'type:Client call')
  const at = (timeline: Array<{ entry: string; at: number }>, entry: string) => timeline.find((t) => t.entry === entry)!.at

  it('step 1 only settles on the week view', async () => {
    const { step, log, sent } = setup({ reducedMotion: false })
    step(1)
    await vi.runAllTimersAsync()

    expect(log).toEqual(['clear-glow', 'navigate:/demo/calendar'])
    expect(sent).toEqual([{ type: 'step-done', step: 1 }])
  })

  it('step 2 plays its beats in order: glide, click, open, type, glide, click, save, pulse', async () => {
    const { step, log } = setup({ reducedMotion: false })
    step(2)
    await vi.runAllTimersAsync()

    expect(withoutKeystrokes(log)).toEqual([
      'clear-glow',
      'navigate:/demo/calendar',
      'cursor:300,400',
      'ripple',
      'navigate:create',
      'type:C',
      'type:Client call',
      'cursor:120,110',
      'ripple',
      'save',
      'navigate:/demo/calendar',
      'pulse:event:new1',
    ])
  })

  it('gives every beat room to land', async () => {
    const { step, timeline } = setup({ reducedMotion: false })
    step(2)
    await vi.runAllTimersAsync()

    const gap = (from: string, to: string, fromIndex = 0) => {
      const first = timeline.filter((t) => t.entry === from)[fromIndex]!
      const next = timeline.find((t) => t.entry === to && t.at >= first.at)!
      return next.at - first.at
    }

    expect(gap('cursor:300,400', 'ripple')).toBeGreaterThanOrEqual(700)
    expect(gap('ripple', 'navigate:create')).toBeGreaterThanOrEqual(200)
    expect(gap('navigate:create', 'type:C')).toBeGreaterThanOrEqual(400)
    expect(gap('type:Client call', 'cursor:120,110')).toBeGreaterThanOrEqual(600)
    expect(gap('cursor:120,110', 'ripple')).toBeGreaterThanOrEqual(700)
    expect(gap('ripple', 'save', 1)).toBeGreaterThanOrEqual(200)
  })

  it('types at about 110ms per character, never in a burst', async () => {
    const { step, timeline } = setup({ reducedMotion: false })
    step(2)
    await vi.runAllTimersAsync()

    const keystrokes = timeline.filter((t) => t.entry.startsWith('type:'))
    expect(keystrokes).toHaveLength('Client call'.length)
    keystrokes.slice(1).forEach((keystroke, i) => {
      const delay = keystroke.at - keystrokes[i]!.at
      expect(delay).toBeGreaterThanOrEqual(80)
      expect(delay).toBeLessThanOrEqual(140)
    })
  })

  it('step 3 closes the open sidebar before pointing at the standup, then rings and opens its note', async () => {
    const { step, log, sidebar } = setup({ reducedMotion: false })
    sidebar.mode = 'view'
    step(3)
    await vi.runAllTimersAsync()

    expect(log).toEqual([
      'clear-glow',
      'navigate:/demo/calendar',
      'navigate:/demo/calendar',
      'cursor:120,110',
      'ripple',
      'navigate:event',
      'glow:eventNotes',
      'cursor:120,110',
      'ripple',
      'clear-glow',
      'open-note',
    ])
    expect(log.indexOf('navigate:/demo/calendar')).toBeLessThan(log.indexOf('ripple'))
  })

  it('step 4 clicks the search box, types, then rings the results', async () => {
    const { step, log } = setup({ reducedMotion: false })
    step(4)
    await vi.runAllTimersAsync()

    expect(log.filter((entry) => !entry.startsWith('search:') || entry === 'search:a' || entry === 'search:acme')).toEqual([
      'clear-glow',
      'navigate:/demo/calendar',
      'cursor:120,110',
      'ripple',
      'search:a',
      'search:acme',
      'glow:searchResults',
    ])
  })

  it('step 5 clicks the dashboard nav item, cross-fades the page around the route change and rings the stats', async () => {
    const { step, log } = setup({ reducedMotion: false })
    step(5)
    await vi.runAllTimersAsync()

    expect(log).toEqual([
      'clear-glow',
      'cursor:120,110',
      'ripple',
      'fade:pageContent:out',
      'navigate:/demo',
      'fade:pageContent:in',
      'glow:statsRow',
      'fade:pageContent:in',
    ])
  })

  it('still performs every action when there is nothing to point at', async () => {
    const { step, log, sent, searchQueries } = setup({ reducedMotion: false, withTargets: false })
    step(4)
    await vi.runAllTimersAsync()

    expect(log.some((entry) => entry.startsWith('cursor:') || entry.startsWith('glow:'))).toBe(false)
    expect(searchQueries.at(-1)).toBe('acme')
    expect(sent).toEqual([{ type: 'step-done', step: 4 }])
  })

  it('with reduced motion nothing waits: no pauses between beats', async () => {
    const { step, timeline, sent } = setup({ reducedMotion: true })
    step(2)
    await vi.runAllTimersAsync()

    expect(Math.max(...timeline.map((t) => t.at))).toBe(0)
    expect(sent).toEqual([{ type: 'step-done', step: 2 }])
  })

  it('hides the visuals and stops all beats the moment the visitor takes over', async () => {
    const { director, step, log, visuals } = setup({ reducedMotion: false })
    step(2)
    await vi.advanceTimersByTimeAsync(900)
    director.takeControlFromTour()
    const length = log.length
    await vi.runAllTimersAsync()

    expect(visuals.hide).toHaveBeenCalledTimes(1)
    expect(log.slice(length)).toEqual([])
  })
})

describe('replaying a step', () => {
  const clientCalls = (events: CalendarEventDisplay[]) => events.filter((e) => e.title === 'Client call')

  it('step 2 deletes the event it created before and creates a fresh one', async () => {
    const { step, events, sidebar, sent, log } = setup()
    step(2)
    await vi.runAllTimersAsync()
    expect(clientCalls(events).map((e) => e.id)).toEqual(['new1'])

    step(3)
    await vi.runAllTimersAsync()
    step(2)
    await vi.runAllTimersAsync()

    expect(log).toContain('delete:new1')
    expect(clientCalls(events).map((e) => e.id)).toEqual(['new2'])
    expect(sidebar.submit).toHaveBeenCalledTimes(2)
    expect(sent.filter((m) => m.type === 'step-failed')).toEqual([])
  })

  it('step 2 deletes a tour event only once and a visitor event is never touched', async () => {
    const visitorEvent = event('mine', 'Client call', iso(14))
    const { step, events, sidebar } = setup({ events: [standup, visitorEvent] })
    step(2)
    await vi.runAllTimersAsync()
    step(2)
    await vi.runAllTimersAsync()

    expect(sidebar.deleteEvent).toHaveBeenCalledTimes(1)
    expect(sidebar.deleteEvent).toHaveBeenCalledWith('new1', { silent: true })
    expect(events.map((e) => e.id)).toContain('mine')
    expect(clientCalls(events)).toHaveLength(2)
  })

  it('does not fail when the visitor already deleted the tour event', async () => {
    const { step, events, sent } = setup()
    step(2)
    await vi.runAllTimersAsync()
    events.splice(events.findIndex((e) => e.id === 'new1'), 1)

    step(2)
    await vi.runAllTimersAsync()

    expect(sent.at(-1)).toEqual({ type: 'step-done', step: 2 })
    expect(clientCalls(events).map((e) => e.id)).toEqual(['new2'])
  })

  it('reports step-failed when the cleanup cannot delete the event', async () => {
    const { step, sidebar, sent } = setup()
    step(2)
    await vi.runAllTimersAsync()
    sidebar.deleteEvent.mockResolvedValueOnce(false)

    step(2)
    await vi.runAllTimersAsync()

    expect(sent.at(-1)).toEqual({ type: 'step-failed', step: 2, reason: 'Could not delete the event the tour created' })
  })

  it('records the created event even when the step is aborted right after saving', async () => {
    const { director, step, events, sidebar, log } = setup()
    const save = sidebar.submit.getMockImplementation()!
    sidebar.submit.mockImplementationOnce(async () => {
      await save()
      director.takeControlFromTour()
    })
    step(2)
    await vi.runAllTimersAsync()
    expect(events.map((e) => e.id)).toContain('new1')

    director.handleLandingMessage(landing({ type: 'resume' }))
    step(2)
    await vi.runAllTimersAsync()

    expect(log).toContain('delete:new1')
    expect(events.filter((e) => e.title === 'Client call').map((e) => e.id)).toEqual(['new2'])
  })

  it('an interrupted cleanup keeps the id, so the next play still deletes the event', async () => {
    const { director, step, events, sidebar } = setup()
    step(2)
    await vi.runAllTimersAsync()

    sidebar.deleteEvent.mockImplementationOnce(async () => {
      director.takeControlFromTour()
      return false
    })
    step(2)
    await vi.runAllTimersAsync()
    expect(events.map((e) => e.id)).toContain('new1')

    director.handleLandingMessage(landing({ type: 'resume' }))
    step(2)
    await vi.runAllTimersAsync()

    expect(sidebar.deleteEvent).toHaveBeenLastCalledWith('new1', { silent: true })
    expect(events.filter((e) => e.title === 'Client call' && e.id.startsWith('new')).map((e) => e.id)).toEqual(['new2'])
  })

  it('step 4 clears the query and types it again', async () => {
    const { step, searchQueries } = setup()
    step(4)
    await vi.runAllTimersAsync()
    searchQueries.length = 0

    step(4)
    await vi.runAllTimersAsync()

    expect(searchQueries[0]).toBe('')
    expect(searchQueries.at(-1)).toBe('acme')
  })

  it('step 5 returns to the calendar before it plays again', async () => {
    const { step, navigations } = setup()
    step(5)
    await vi.runAllTimersAsync()
    navigations.length = 0

    step(5)
    await vi.runAllTimersAsync()

    expect(navigations[0]).toEqual({ path: '/demo/calendar', query: {} })
    expect(navigations.at(-1)).toEqual({ path: '/demo', query: {} })
  })
})
