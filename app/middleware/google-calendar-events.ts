import { useGoogleCalendarStore, useGoogleCalendar } from "@features/integrations/google-calendar";

export default defineNuxtRouteMiddleware(async (to) => {
  const googleCalendarStore = useGoogleCalendarStore()
  const { fetchConnectedAccounts, fetchCalendarEvents } = useGoogleCalendar()
  useGoogleCalendar()

  await fetchConnectedAccounts()
  googleCalendarStore.getAccounts.forEach((account) => fetchCalendarEvents(account.id))
})
