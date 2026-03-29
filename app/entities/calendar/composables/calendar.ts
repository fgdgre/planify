import { useGoogleCalendar, useGoogleCalendarStore } from "@features/integrations/google-calendar";
import { useCalendarStore } from "@entities/calendar/stores/calendar";

export const useCalendar = () => {

  const calendarStore = useCalendarStore()
  const googleCalendarStore = useGoogleCalendarStore()
  const { allEvents, accounts } = storeToRefs(googleCalendarStore)
  const { loadEventsFromDb } = useGoogleCalendar()

  const fetchEvents = async () => {
    return Promise.allSettled(accounts.value?.map(async (account) => {
      await loadEventsFromDb(account.id)
    }))
  }

  const loadViewEvents = async (range: { start: Temporal.ZonedDateTime, end: Temporal.ZonedDateTime }) => {
    const start = range.start.toInstant().toString()
    const end = range.end.toInstant().toString()

    calendarStore.setViewRange({ start, end })

    await fetchEvents()
  }

  return {
    loadViewEvents,
    fetchEvents,
  }
}
