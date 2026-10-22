import { resolveAppPath, type TourStep } from '@shared/api/demo'
import { ROUTES } from '@shared/constants/routes'
import type { CalendarControls, CalendarEventDisplay, EventSidebarControls } from '@entities/calendar'
import { typeText, waitFor } from './timing'

/** Everything a step may touch. All of it is typed app API, never the DOM. */
export interface TourEnv {
  navigate: (location: { path: string; query?: Record<string, string> }) => Promise<unknown>
  currentPath: () => string
  calendar: () => CalendarControls | null
  eventSidebar: () => EventSidebarControls | null
  events: () => CalendarEventDisplay[]
  setSearchQuery: (value: string) => void
  now: () => Date
  reducedMotion: boolean
  signal: AbortSignal
}

const CLIENT_CALL_TITLE = 'Client call'
const STANDUP_TITLE = 'Acme standup'
const SEARCH_TEXT = 'acme'

const stripTimezone = (iso: string) => iso.replace(/\[.*\]$/, '')
const startMs = (event: CalendarEventDisplay) => new Date(stripTimezone(event.start_at)).getTime()

const atHour = (day: Date, hour: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0)

/** Calendar page with the week view on screen, sidebar closed and search empty. */
async function showWeekView(env: TourEnv): Promise<void> {
  env.setSearchQuery('')
  await env.navigate({ path: resolveAppPath(ROUTES.CALENDAR), query: {} })

  const calendar = await waitFor(env.calendar, { what: 'the calendar', signal: env.signal })
  calendar.showCurrentWeek()
}

async function waitForEvents(env: TourEnv): Promise<CalendarEventDisplay[]> {
  return waitFor(() => (env.events().length ? env.events() : null), { what: 'calendar events', signal: env.signal })
}

async function createClientCall(env: TourEnv, start: Date, end: Date): Promise<void> {
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

  await typeText(CLIENT_CALL_TITLE, sidebar.setTitle, env)
  await sidebar.submit()

  await waitFor(
    () => env.eventSidebar()?.mode === 'view' && env.eventSidebar()?.selectedEvent?.title === CLIENT_CALL_TITLE,
    { what: 'the saved event', signal: env.signal },
  )
}

const steps: Record<TourStep, (env: TourEnv) => Promise<void>> = {
  1: async (env) => {
    await showWeekView(env)
  },

  /** Creates today's 14:00 "Client call"; idempotent, so repeating the tour only opens it. */
  2: async (env) => {
    await showWeekView(env)
    const events = await waitForEvents(env)

    const start = atHour(env.now(), 14)
    const end = atHour(env.now(), 15)
    const existing = events.find((event) => event.title === CLIENT_CALL_TITLE && startMs(event) === start.getTime())

    if (existing) {
      await env.navigate({ path: resolveAppPath(ROUTES.CALENDAR), query: { eventId: existing.id } })
      return
    }

    await createClientCall(env, start, end)
  },

  3: async (env) => {
    await showWeekView(env)
    const events = await waitForEvents(env)

    const standup = events
      .filter((event) => event.title === STANDUP_TITLE)
      .sort((a, b) => startMs(a) - startMs(b))[0]
    if (!standup) throw new Error(`No "${STANDUP_TITLE}" event found`)

    await env.navigate({ path: resolveAppPath(ROUTES.CALENDAR), query: { eventId: standup.id } })

    const sidebar = await waitFor(
      () => {
        const current = env.eventSidebar()
        return current?.selectedEvent?.id === standup.id && current.eventNotes.length > 0 && current
      },
      { what: 'the event notes', signal: env.signal },
    )

    await sidebar.openNote(sidebar.eventNotes[0]!)
  },

  4: async (env) => {
    await showWeekView(env)
    await waitForEvents(env)

    await typeText(SEARCH_TEXT, env.setSearchQuery, env)
  },

  5: async (env) => {
    env.setSearchQuery('')
    await env.navigate({ path: resolveAppPath(ROUTES.HOME), query: {} })
  },
}

/** Performs one tour step. Rejects when the step cannot run; the director turns that into `step-failed`. */
export const runTourStep = (step: TourStep, env: TourEnv): Promise<void> => steps[step](env)
