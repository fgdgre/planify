import { useUserStore } from '@features/auth'
import { ROUTES } from '@shared/constants/routes'

export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()
  const userStore = useUserStore()

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      userStore.setClear()
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
