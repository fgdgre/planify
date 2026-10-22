import { afterEach, describe, expect, it } from 'vitest'
import { __resetDemoModeForTests, resolveAppPath, toDemoPath } from '@shared/api/demo'

describe('toDemoPath', () => {
  it.each([
    ['/app', '/demo'],
    ['/app/', '/demo/'],
    ['/app/calendar', '/demo/calendar'],
    ['/app/settings', '/demo/settings'],
  ])('%s -> %s', (from, to) => {
    expect(toDemoPath(from)).toBe(to)
  })

  it.each(['/', '/demo/calendar', '/application', '/login', '/apple/app'])('leaves %s alone', (path) => {
    expect(toDemoPath(path)).toBe(path)
  })
})

describe('resolveAppPath', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
    __resetDemoModeForTests()
  })

  it('rewrites only when the session booted in demo mode', () => {
    expect(resolveAppPath('/app/notes')).toBe('/app/notes')

    __resetDemoModeForTests()
    window.history.replaceState({}, '', '/demo/calendar')
    expect(resolveAppPath('/app/notes')).toBe('/demo/notes')
  })
})
