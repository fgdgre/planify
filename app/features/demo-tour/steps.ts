import { resolveAppPath, type TourStep, type TourTarget } from '@shared/api/demo'
import { ROUTES } from '@shared/constants/routes'
import type {
  CalendarControls,
  CalendarEventDisplay,
  CalendarSearchControls,
  EventSidebarControls,
} from '@entities/calendar'
import { beat, click, findOptional, glideTo, highlight, pulse } from './choreography'
import {
  AFTER_SAVE_MS,
  BEFORE_SAVE_MS,
  CLOSE_SETTLE_MS,
  PAGE_FADE_IN_MS,
  PAGE_FADE_OUT_MS,
  SIDEBAR_SETTLE_MS,
  STEP_SETTLE_MS,
  typeText,
  waitFor,
} from './timing'
import type { TourVisuals } from './visuals'

/** Everything a step may touch. All of it is typed app API, never the DOM or a selector. */
export interface TourEnv {
  navigate: (location: { path: string; query?: Record<string, string> }) => Promise<unknown>
  currentPath: () => string
  calendar: () => CalendarControls | null
  eventSidebar: () => EventSidebarControls | null
  events: () => CalendarEventDisplay[]
  /** The range the calendar currently shows (ISO instants), once known. */
  viewRange: () => { start: string; end: string } | null
  searchBox: () => CalendarSearchControls | null
  /** Elements components published for the tour to point at; null when not on screen. */
  target: (name: TourTarget) => HTMLElement | null
  /** Ghost cursor, rings and glow. */
  visuals: TourVisuals
  now: () => Date
  reducedMotion: boolean
  signal: AbortSignal
  /** Source of typing jitter; defaults to `Math.random`. */
  random?: () => number
}

const CLIENT_CALL_TITLE = 'Client call'
const STANDUP_TITLE = 'Acme standup'
const SEARCH_TEXT = 'acme'

const stripTimezone = (iso: string) => iso.replace(/\[.*\]$/, '')
const startMs = (event: CalendarEventDisplay) => new Date(stripTimezone(event.start_at)).getTime()

const atHour = (day: Date, hour: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0)

/**
 * Closes the event/note sidebar if one is open and waits for it to be gone, so
 * two panels (or a panel and a popover) are never on screen at once.
 */
async function closeSidebars(env: TourEnv): Promise<void> {
  if (!env.eventSidebar()?.mode) return

  await env.navigate({ path: env.currentPath(), query: {} })
  await waitFor(() => !env.eventSidebar()?.mode, { what: 'the sidebar to close', signal: env.signal })
  await beat(CLOSE_SETTLE_MS, env)
}

/** Calendar page with the week view on screen, sidebar closed and search empty. */
async function showWeekView(env: TourEnv): Promise<void> {
  env.searchBox()?.setQuery('')
  await closeSidebars(env)
  await env.navigate({ path: resolveAppPath(ROUTES.CALENDAR), query: {} })

  const calendar = await waitFor(env.calendar, { what: 'the calendar', signal: env.signal })
  calendar.showCurrentWeek()
}

/**
 * Events of the week being shown. Waits until the calendar's range covers today
 * and holds events inside it, so events left over from another range (or none
 * yet) are never mistaken for the current week.
 */
async function waitForEvents(env: TourEnv): Promise<CalendarEventDisplay[]> {
  return waitFor(
    () => {
      const range = env.viewRange()
      if (!range) return null

      const from = new Date(range.start).getTime()
      const to = new Date(range.end).getTime()
      const now = env.now().getTime()
      if (now < from || now > to) return null

      const inRange = env.events().filter((event) => startMs(event) >= from && startMs(event) <= to)
      return inRange.length ? inRange : null
    },
    { what: 'calendar events', signal: env.signal },
  )
}

/** Calendar handle; the week view is on screen by now, so it must exist. */
const calendarOf = (env: TourEnv) => waitFor(env.calendar, { what: 'the calendar', signal: env.signal })

/** Opens the create sidebar on `start`, types the title, saves; returns the new event's id. */
async function createClientCall(env: TourEnv, start: Date, end: Date): Promise<string> {
  await env.navigate({
    path: resolveAppPath(ROUTES.CALENDAR),
    query: {
      action: 'create',
      eventStart: start.toISOString(),
      eventEnd: end.toISOString(),
      eventAllDay: 'false',
    },
  })

  const sidebar = await waitFor(
    () => env.eventSidebar()?.mode === 'create' && env.eventSidebar(),
    { what: 'the create event sidebar', signal: env.signal },
  )
  await beat(SIDEBAR_SETTLE_MS, env)

  await typeText(CLIENT_CALL_TITLE, sidebar.setTitle, env)
  await beat(BEFORE_SAVE_MS, env)

  await glideTo(env, await findOptional(() => env.target('sidebarSubmit'), env))
  await click(env)
  await sidebar.submit()

  const saved = await waitFor(
    () => {
      const current = env.eventSidebar()
      return current?.mode === 'view' && current.selectedEvent?.title === CLIENT_CALL_TITLE && current.selectedEvent
    },
    { what: 'the saved event', signal: env.signal },
  )
  return saved.id
}

/** Points at an event in the grid with a single pulse, once it has rendered. */
async function pulseEvent(env: TourEnv, id: string): Promise<void> {
  const calendar = await calendarOf(env)
  await pulse(env, await findOptional(() => calendar.eventElement(id), env))
}

const steps: Record<TourStep, (env: TourEnv) => Promise<void>> = {
  /** The unified week grid: the tour only settles on it. */
  1: async (env) => {
    await showWeekView(env)
    await beat(STEP_SETTLE_MS, env)
  },

  /**
   * Clicks a free slot today at 14:00 and creates "Client call" like a visitor
   * would. Idempotent: when it already exists the tour only points at it.
   */
  2: async (env) => {
    await showWeekView(env)
    const events = await waitForEvents(env)
    await beat(STEP_SETTLE_MS, env)

    const start = atHour(env.now(), 14)
    const end = atHour(env.now(), 15)
    const existing = events.find((event) => event.title === CLIENT_CALL_TITLE && startMs(event) === start.getTime())
    const calendar = await calendarOf(env)

    await glideTo(env, calendar.slotPoint(start))
    await click(env)

    if (existing) {
      await pulseEvent(env, existing.id)
      return
    }

    const createdId = await createClientCall(env, start, end)
    await beat(AFTER_SAVE_MS, env)
    // The sidebar covers the grid's right side: close it so the new event is seen landing.
    await closeSidebars(env)
    await pulseEvent(env, createdId)
  },

  /** Opens the Acme standup, rings its notes and opens the first one. */
  3: async (env) => {
    await showWeekView(env)
    const events = await waitForEvents(env)
    await beat(STEP_SETTLE_MS, env)

    const standup = events
      .filter((event) => event.title === STANDUP_TITLE)
      .sort((a, b) => startMs(a) - startMs(b))[0]
    if (!standup) throw new Error(`No "${STANDUP_TITLE}" event found`)

    const calendar = await calendarOf(env)
    await glideTo(env, await findOptional(() => calendar.eventElement(standup.id), env))
    await click(env)
    await env.navigate({ path: resolveAppPath(ROUTES.CALENDAR), query: { eventId: standup.id } })

    const sidebar = await waitFor(
      () => {
        const current = env.eventSidebar()
        return current?.selectedEvent?.id === standup.id && current.eventNotes.length > 0 && current
      },
      { what: 'the event notes', signal: env.signal },
    )
    await beat(SIDEBAR_SETTLE_MS, env)

    const notes = await findOptional(() => env.target('eventNotes'), env)
    await highlight(env, notes)
    await glideTo(env, notes)
    await click(env)
    env.visuals.clearGlow()
    await sidebar.openNote(sidebar.eventNotes[0]!)
    await beat(SIDEBAR_SETTLE_MS, env)
  },

  /** Types "acme" into the search box and rings the matches. */
  4: async (env) => {
    await showWeekView(env)
    await waitForEvents(env)
    await beat(STEP_SETTLE_MS, env)

    const searchBox = await waitFor(env.searchBox, { what: 'the calendar search', signal: env.signal })
    await glideTo(env, await findOptional(() => env.target('searchBox'), env))
    await click(env)
    await typeText(SEARCH_TEXT, searchBox.setQuery, env)

    await highlight(env, await findOptional(() => env.target('searchResults'), env))
  },

  /**
   * Goes to the dashboard through its nav item. The page content cross-fades
   * around the route change so the swap never looks like a lag followed by a jump.
   */
  5: async (env) => {
    env.searchBox()?.setQuery('')
    await closeSidebars(env)
    await beat(STEP_SETTLE_MS, env)

    await glideTo(env, await findOptional(() => env.target('dashboardNav'), env))
    await click(env)

    const content = env.target('pageContent')
    try {
      if (content) {
        env.visuals.fadeContent(content, false, PAGE_FADE_OUT_MS)
        await beat(PAGE_FADE_OUT_MS, env)
      }

      await env.navigate({ path: resolveAppPath(ROUTES.HOME), query: {} })
      const stats = await findOptional(() => env.target('statsRow'), env, 4000)

      if (content) {
        env.visuals.fadeContent(content, true, PAGE_FADE_IN_MS)
        await beat(PAGE_FADE_IN_MS, env)
      }
      await highlight(env, stats)
    } finally {
      if (content) env.visuals.fadeContent(content, true, 0)
    }
  },
}

/**
 * Performs one tour step. Rejects when the step cannot run; the director turns
 * that into `step-failed`. Whatever the previous step left on screen is cleared first.
 */
export const runTourStep = (step: TourStep, env: TourEnv): Promise<void> => {
  env.visuals.clearGlow()
  return steps[step](env)
}
