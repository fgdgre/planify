import { useGoogleCalendarStore, useGoogleCalendar } from "@features/integrations/google-calendar";

export default defineNuxtRouteMiddleware(async () => {
  const googleCalendarStore = useGoogleCalendarStore()
  const { fetchConnectedAccounts, fetchCalendarEvents, syncEvents } = useGoogleCalendar()

  await fetchConnectedAccounts()

  const accounts = googleCalendarStore.getAccounts

  // Each account: populate calendars table → sync events from Google → load from DB
  // Not awaited so navigation isn't blocked. The watch in calendar.vue picks up events reactively.
  Promise.all(accounts.map(async (account) => {
    await fetchCalendarEvents(account.id)
    await syncEvents(account.id)
  }))
})
