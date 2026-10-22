import { isDemoMode } from '@shared/api/demo'
import { useUserStore } from '@features/auth'

/**
 * In demo mode there is no sign-in: install the in-memory backend and seed the
 * user store with the demo user, so pages and middleware that check
 * `userStore.user` treat the visitor as signed in.
 *
 * The backend is a dynamic import, so visitors of the real app never download
 * it; Nuxt awaits async plugins, so it is registered before any page runs.
 */
export default defineNuxtPlugin(async () => {
  if (!isDemoMode()) return

  const { installDemoBackend } = await import('@shared/api/demo/install')
  useUserStore().setUser(installDemoBackend())
})
