import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createBrowserClient = vi.fn(() => ({ auth: {} }))
vi.mock('@supabase/ssr', () => ({ createBrowserClient }))

vi.stubGlobal('useRuntimeConfig', () => ({
  public: { supabaseUrl: 'https://abcdefgh.supabase.co', supabaseAnonKey: 'anon-key' },
}))

const { isDemoMode, DEMO_BASE, __resetDemoModeForTests, DEMO_USER } = await import('@shared/api/demo')
const { useDb, onDbClientCreated, __resetDbClientForTests } = await import('@shared/api/supabase/client')
const { getSafeStorage } = await import('@shared/lib/safe-storage')

const visit = (path: string) => {
  window.history.pushState({}, '', path)
  __resetDemoModeForTests()
}

afterEach(() => {
  visit('/')
  __resetDbClientForTests()
  createBrowserClient.mockClear()
})

describe('isDemoMode', () => {
  it('exposes the demo base path', () => {
    expect(DEMO_BASE).toBe('/demo')
  })

  it.each([
    ['/', false],
    ['/app/calendar', false],
    ['/demo', true],
    ['/demo/', true],
    ['/demo/calendar', true],
    ['/demos', false],
    ['/demo-other', false],
  ])('on %s is %s', (path, expected) => {
    visit(path)
    expect(isDemoMode()).toBe(expected)
  })

  it('reads the location once and never flips during the session', () => {
    visit('/demo')
    expect(isDemoMode()).toBe(true)

    window.history.pushState({}, '', '/app')
    expect(isDemoMode()).toBe(true)
  })
})

describe('useDb in demo mode', () => {
  beforeEach(() => {
    __resetDbClientForTests()
    createBrowserClient.mockClear()
  })

  it('returns the fake singleton and never builds the real client', async () => {
    visit('/demo/calendar')

    const first = useDb()
    const second = useDb()

    expect(first).toBe(second)
    expect(createBrowserClient).not.toHaveBeenCalled()
    expect((await first.auth.getUser()).data.user).toEqual(DEMO_USER)
  })

  it('does not hand the fake client to onDbClientCreated callbacks', () => {
    visit('/demo')
    const callback = vi.fn()

    onDbClientCreated(callback)
    useDb()

    expect(callback).not.toHaveBeenCalled()
  })

  it('still builds the real client outside the demo', () => {
    visit('/app')
    useDb()
    expect(createBrowserClient).toHaveBeenCalledTimes(1)
  })
})

describe('getSafeStorage', () => {
  it('is localStorage outside the demo', () => {
    visit('/app')
    expect(getSafeStorage()).toBe(window.localStorage)
  })

  it('is an isolated in-memory Storage in the demo', () => {
    visit('/demo')
    const storage = getSafeStorage()!

    expect(storage).not.toBe(window.localStorage)
    expect(storage.getItem('k')).toBeNull()

    storage.setItem('k', 'v')
    expect(storage.getItem('k')).toBe('v')
    expect(storage.length).toBe(1)
    expect(storage.key(0)).toBe('k')
    expect(window.localStorage.getItem('k')).toBeNull()

    storage.removeItem('k')
    expect(storage.getItem('k')).toBeNull()

    storage.setItem('a', '1')
    storage.clear()
    expect(storage.length).toBe(0)
  })

  it('keeps the same memory across calls so drafts survive navigation', () => {
    visit('/demo')
    getSafeStorage()!.setItem('draft', 'x')
    expect(getSafeStorage()!.getItem('draft')).toBe('x')
  })
})
