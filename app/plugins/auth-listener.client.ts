import { useUserStore } from '@features/auth'

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
  })
})
