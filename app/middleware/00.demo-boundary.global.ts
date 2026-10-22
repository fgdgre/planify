import { isDemoMode, isDemoPath } from '@shared/api/demo'

/**
 * Demo mode is decided once, at boot (see `isDemoMode`). A visitor of the real
 * app who navigates client-side to `/demo/**` would otherwise get demo pages
 * running against the real database client, so force a full page load: the
 * demo then boots cleanly in demo mode.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (isDemoMode() || !isDemoPath(to.path)) return

  window.location.assign(to.fullPath)
  return abortNavigation()
})
