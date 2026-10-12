import { useUserStore } from '@features/auth'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useSettingsStore } from '@features/settings'

export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const userStore = useUserStore()
  const googleCalendarStore = useGoogleCalendarStore()
  const settingsStore = useSettingsStore()

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      userStore.setClear()
      // Per-session caches must not leak into the next sign-in.
      googleCalendarStore.reset()
      settingsStore.setUserPreferences(null)
      return
    }

    if (session?.user) {
      userStore.setUser(session.user)
    }
  })
})
