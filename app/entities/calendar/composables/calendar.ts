import { useCalendarStore } from '../stores/calendar'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useGoogleCalendar } from '@features/integrations/google-calendar'
import type { CalendarEventDisplay } from '../types'
import type { CalendarEvent } from '@features/integrations/google-calendar'

const mapGoogleEventToDisplay = (event: CalendarEvent): CalendarEventDisplay => ({
  id: event.id,
  title: event.title ?? '(No title)',
  start_at: event.start_at,
  end_at: event.end_at,
  all_day: event.all_day,
  description: event.description ?? undefined,
  location: event.location ?? undefined,
  creator_email: event.creator_email ?? undefined,
  sourceAccountId: event.google_account_id,
})

export const useCalendar = () => {
  const calendarStore = useCalendarStore()
  const googleCalendarStore = useGoogleCalendarStore()
  const { accounts, allEvents } = storeToRefs(googleCalendarStore)
  const { loadEventsFromDb } = useGoogleCalendar()

  const fetchEvents = async () => {
    const range = calendarStore.viewRange
    if (!range) return

    await Promise.allSettled(
      accounts.value.map((account) => loadEventsFromDb(account.id, range))
    )

    const mapped = allEvents.value.map(mapGoogleEventToDisplay)
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
