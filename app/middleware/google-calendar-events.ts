import { useGoogleCalendarStore, useGoogleCalendar } from "@features/integrations/google-calendar";
import { useInternalEvents } from "@entities/calendar/composables/useInternalEvents";

export default defineNuxtRouteMiddleware(async () => {
  const googleCalendarStore = useGoogleCalendarStore()
  const { fetchConnectedAccounts, fetchCalendarEvents, syncEvents } = useGoogleCalendar()
  const { loadEvents: loadInternalEvents } = useInternalEvents()

  await fetchConnectedAccounts()

  const accounts = googleCalendarStore.accounts

  // Load internal events + sync google accounts in parallel.
  // Not fully awaited so navigation isn't blocked. The watch in calendar.vue picks up events reactively.
  Promise.all([
    loadInternalEvents(),
    ...accounts.map(async (account) => {
      await fetchCalendarEvents(account.id)
      await syncEvents(account.id)
    }),
  ])
})
