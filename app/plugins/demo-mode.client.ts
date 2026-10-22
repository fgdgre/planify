import { DEMO_USER, isDemoMode } from '@shared/api/demo'
import { useUserStore } from '@features/auth'

/**
 * In demo mode there is no sign-in: seed the user store with the demo user so
 * pages and middleware that check `userStore.user` treat the visitor as signed
 * in. Touches only the store; the fake database client is created on demand.
 */
export default defineNuxtPlugin(() => {
  if (!isDemoMode()) return

  useUserStore().setUser(DEMO_USER)
})
