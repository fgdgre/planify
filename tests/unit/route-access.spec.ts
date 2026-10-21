import { describe, expect, it } from 'vitest'
import { getRouteAccess } from '@shared/constants/public-routes'

describe('getRouteAccess', () => {
  it.each(['/', '/privacy-policy/', '/terms-of-service', '/demo', '/demo/', '/demo/calendar'])(
    'treats %s as marketing',
    (path) => expect(getRouteAccess(path)).toBe('marketing'),
  )

  it.each(['/login', '/signup', '/forgot-password', '/reset-password', '/confirm', '/login/'])(
    'treats %s as auth',
    (path) => expect(getRouteAccess(path)).toBe('auth'),
  )

  it.each(['/app', '/app/calendar', '/app/settings', '/demos', '/unknown'])(
    'treats %s as app',
    (path) => expect(getRouteAccess(path)).toBe('app'),
  )
})
