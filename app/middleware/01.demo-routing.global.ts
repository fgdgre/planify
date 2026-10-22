import { isDemoMode, toDemoPath } from '@shared/api/demo'

/**
 * Keeps a demo visitor inside `/demo`. Code that navigates to `/app/**` (route
 * constants, redirects, bookmarks) is rewritten to the same page under `/demo`,
 * keeping query and hash. Runs before the auth middleware; outside demo mode it
 * does nothing.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (!isDemoMode()) return

  const demoPath = toDemoPath(to.path)
  if (demoPath === to.path) return

  return navigateTo({ path: demoPath, query: to.query, hash: to.hash }, { replace: true })
})
