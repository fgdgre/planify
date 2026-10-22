import { DEMO_BASE, isDemoMode } from './demo-mode'

const APP_BASE = '/app'

/**
 * Moves an `/app` or `/app/**` path under the demo base; any other path is
 * returned untouched. Pure, so it can be tested without a browser.
 */
export function toDemoPath(path: string): string {
  if (path === APP_BASE || path.startsWith(`${APP_BASE}/`)) {
    return DEMO_BASE + path.slice(APP_BASE.length)
  }
  return path
}

/**
 * Resolves an app path for the current session: the demo twin of it in demo
 * mode (so links and active states match the URL the visitor is on), the path
 * itself everywhere else.
 */
export function resolveAppPath(path: string): string {
  return isDemoMode() ? toDemoPath(path) : path
}

/** True for `/demo` and everything below it. */
export function isDemoPath(path: string): boolean {
  return path === DEMO_BASE || path.startsWith(`${DEMO_BASE}/`)
}
