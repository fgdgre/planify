import { ROUTES } from '@shared/constants/routes'

export type RouteAccess = 'marketing' | 'auth' | 'app'

const MARKETING_ROUTES: string[] = [ROUTES.LANDING, ROUTES.PRIVACY_POLICY, ROUTES.TERMS_OF_SERVICE]
const MARKETING_PREFIXES = ['/demo']
const AUTH_ROUTES: string[] = [ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD, ROUTES.CONFIRM]

/**
 * Classifies a path by what it needs from the backend:
 * - `marketing`: public pages that must never create a Supabase client or touch auth
 * - `auth`: sign-in flows that need to know the session to bounce signed-in users
 * - `app`: everything else, which requires a signed-in user
 */
export function getRouteAccess(path: string): RouteAccess {
  const normalized = path !== '/' ? path.replace(/\/+$/, '') : '/'

  if (
    MARKETING_ROUTES.includes(normalized) ||
    MARKETING_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
  ) {
    return 'marketing'
  }
  if (AUTH_ROUTES.includes(normalized)) {
    return 'auth'
  }
  return 'app'
}
