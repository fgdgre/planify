import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const abortNavigation = vi.fn(() => false)
vi.stubGlobal('defineNuxtRouteMiddleware', (handler: unknown) => handler)
vi.stubGlobal('abortNavigation', abortNavigation)

const { __resetDemoModeForTests } = await import('@shared/api/demo')
const guard = (await import('~/middleware/00.demo-boundary.global')).default as unknown as (to: { path: string; fullPath: string }) => unknown

const assign = vi.fn()
const originalLocation = window.location

const bootAt = (path: string) => {
  window.history.pushState({}, '', path)
  __resetDemoModeForTests()
}

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { get pathname() { return originalLocation.pathname }, assign },
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
  window.history.pushState({}, '', '/')
  __resetDemoModeForTests()
  vi.clearAllMocks()
})

describe('demo boundary guard', () => {
  it.each(['/demo', '/demo/calendar'])('forces a full page load for %s when the session did not boot in demo mode', (path) => {
    bootAt('/app/calendar')

    const result = guard({ path, fullPath: `${path}?x=1` })

    expect(assign).toHaveBeenCalledWith(`${path}?x=1`)
    expect(abortNavigation).toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('lets demo navigation through inside a demo session', () => {
    bootAt('/demo/calendar')

    expect(guard({ path: '/demo/notes', fullPath: '/demo/notes' })).toBeUndefined()
    expect(assign).not.toHaveBeenCalled()
  })

  it.each(['/app', '/app/calendar', '/login', '/demonstration'])('ignores %s in the real app', (path) => {
    bootAt('/app')

    expect(guard({ path, fullPath: path })).toBeUndefined()
    expect(assign).not.toHaveBeenCalled()
  })
})
