import { useCalendarStore } from '../stores/calendar'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useGoogleCalendar } from '@features/integrations/google-calendar'
import { useInternalEvents } from './useInternalEvents'
import type { CalendarEventDisplay } from '../types'
import type { CalendarEvent } from '@features/integrations/google-calendar'

const mapEventToDisplay = (event: CalendarEvent): CalendarEventDisplay => ({
  id: event.id,
  title: event.title ?? '(No title)',
  start_at: event.start_at,
  end_at: event.end_at,
  all_day: event.all_day,
  description: event.description ?? undefined,
  location: event.location ?? undefined,
  creator_email: event.creator_email ?? undefined,
  html_link: event.html_link ?? undefined,
  sourceAccountId: event.is_internal ? `internal_${event.user_id}` : event.google_account_id,
  source: event.is_internal ? 'internal' : 'google',
})

export const useCalendar = () => {
  const calendarStore = useCalendarStore()
  const googleCalendarStore = useGoogleCalendarStore()
  const { accounts, allEvents } = storeToRefs(googleCalendarStore)
  const { loadEventsFromDb } = useGoogleCalendar()
  const { loadEvents: loadInternalEvents } = useInternalEvents()

  const fetchEvents = async () => {
    const range = calendarStore.viewRange
    if (!range) return

    // Load google + internal events in parallel
    await Promise.allSettled([
      ...accounts.value.map((account) => loadEventsFromDb(account.id, range)),
      loadInternalEvents(range),
    ])

    // All events (google + internal) are now in the google calendar store, mapped uniformly
    const mapped = allEvents.value.map(mapEventToDisplay)
    calendarStore.setEvents(mapped)
  }

  const loadViewEvents = async (range: { start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime }) => {
    calendarStore.setViewRange({
      start: range.start.toInstant().toString(),
      end: range.end.toInstant().toString(),
    })

    await fetchEvents()
  }

  return {
    loadViewEvents,
    fetchEvents,
  }
}
