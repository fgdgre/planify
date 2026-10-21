import { useGoogleCalendarStore, useGoogleCalendar } from "@features/integrations/google-calendar";
import { useSettings, useSettingsStore } from "@features/settings";
import { useUserStore } from "@features/auth/stores/user";

/**
 * Makes accounts, preferences and Google events available on the pages that
 * render the calendar. Everything is cached for the session: accounts and
 * preferences load once, and Google is only asked for new events when an
 * account's cache is older than SYNC_TTL_MS. Query-only navigations (opening a
 * sidebar, selecting an event) never touch the network.
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  const userStore = useUserStore()
  if (!userStore.user) return

  const googleCalendarStore = useGoogleCalendarStore()
  const settingsStore = useSettingsStore()
  const { fetchConnectedAccounts, syncAllAccounts } = useGoogleCalendar()
  const { getUserPreferences, syncAccountColors } = useSettings()

  const isQueryOnlyNavigation = to.path === from.path
  if (isQueryOnlyNavigation && googleCalendarStore.accountsLoaded) return

  const userId = userStore.user.id

  await Promise.all([
    fetchConnectedAccounts(),
    settingsStore.preferences ? Promise.resolve() : getUserPreferences(userId),
  ])

  await syncAccountColors(userId, googleCalendarStore.accounts)

  // Not awaited so navigation isn't blocked. Views reload through `syncVersion` once it finishes.
  void syncAllAccounts()
})
