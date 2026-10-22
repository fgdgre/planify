import { onDbClientCreated } from '@shared/api/supabase'
import { useUserStore } from '@features/auth'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useSettingsStore } from '@features/settings'
import { useCalendarFiltersStore } from '@entities/calendar/stores/calendar-filters'
import { ROUTES } from '@shared/constants/routes'

export default defineNuxtPlugin(() => {
  const userStore = useUserStore()
  const googleCalendarStore = useGoogleCalendarStore()
  const settingsStore = useSettingsStore()
  const calendarFiltersStore = useCalendarFiltersStore()

  // Subscribe only once the client exists, so this plugin never forces its creation
  // (marketing pages must not build a client).
  onDbClientCreated((supabase) => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        userStore.setClear()
        // Per-session caches must not leak into the next sign-in.
        googleCalendarStore.reset()
        settingsStore.setUserPreferences(null)
        calendarFiltersStore.reset()
        return
      }

      if (session?.user) {
        userStore.setUser(session.user)
      }

      // A recovery link signs the user in; make sure they land on the form that
      // sets a new password rather than anywhere else in the app.
      if (event === 'PASSWORD_RECOVERY') {
        navigateTo(ROUTES.RESET_PASSWORD)
      }
    })
  })
})
