import { useDb } from '@shared/api/supabase'
import { useCalendarStore } from '../stores/calendar'
import { groupEventsBySource } from '../helpers/events'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useUserStore } from '@features/auth/stores/user'
import { useNotification } from '@features/notification'
import type { CalendarEventDisplay, ViewDateRange } from '../types'
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
  sourceAccountId: event.is_internal ? `internal_${event.user_id}` : event.google_account_id ?? undefined,
  source: event.is_internal ? 'internal' : 'google',
})

export const useCalendar = () => {
  const supabase = useDb()
  const calendarStore = useCalendarStore()
  const googleCalendarStore = useGoogleCalendarStore()
  const userStore = useUserStore()
  const { allEvents } = storeToRefs(googleCalendarStore)
  const { showErrorToast } = useNotification()

  /**
   * One query for everything the user can see in `range`: internal events and
   * every connected Google account together. Replaces the earlier fan-out of
   * one request per account plus one for internal events.
   */
  const loadEventsInRange = async (range: ViewDateRange) => {
    const userId = userStore.user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_at', range.start)
      .lte('end_at', range.end)
      .order('start_at', { ascending: true })

    if (error) {
      showErrorToast({ title: 'Error', description: error.message })
      return
    }

    googleCalendarStore.replaceCalendarEvents(groupEventsBySource(data ?? []))
  }

  const fetchEvents = async () => {
    const range = calendarStore.viewRange
    if (!range) return

    await loadEventsInRange(range)

    // All events (google + internal) are now in the google calendar store, mapped uniformly
    calendarStore.setEvents(allEvents.value.map(mapEventToDisplay))
  }

  const loadViewEvents = async (range: { start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime }) => {
    calendarStore.setViewRange({
      start: range.start.toInstant().toString(),
      end: range.end.toInstant().toString(),
    })

    await fetchEvents()
  }

  const fetchEventsForRange = async (range: ViewDateRange) => {
    await loadEventsInRange(range)

    return allEvents.value.map(mapEventToDisplay)
  }

  return {
    loadEventsInRange,
    loadViewEvents,
    fetchEvents,
    fetchEventsForRange,
  }
}
