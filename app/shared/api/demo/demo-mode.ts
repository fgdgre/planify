/** Base path of the public demo. The app mounted under it runs against in-memory data only. */
export const DEMO_BASE = '/demo'

let cached: boolean | null = null

/**
 * True when the app booted on `/demo` or `/demo/**`.
 *
 * The location is read once and cached on purpose: demo mode decides which
 * database client the whole session uses, so it must never flip halfway (for
 * example when a route change leaves `/demo`). Outside the browser it is always
 * false and nothing is cached.
 */
export function isDemoMode(): boolean {
  if (cached !== null) return cached
  if (typeof window === 'undefined') return false

  const { pathname } = window.location
  cached = pathname === DEMO_BASE || pathname.startsWith(`${DEMO_BASE}/`)
  return cached
}

/** Test-only: forgets the cached answer so the next call reads the location again. */
export function __resetDemoModeForTests(): void {
  cached = null
}
