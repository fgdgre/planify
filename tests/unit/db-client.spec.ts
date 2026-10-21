import { beforeEach, describe, expect, it, vi } from 'vitest'

const createBrowserClient = vi.fn(() => ({ auth: {} }))
vi.mock('@supabase/ssr', () => ({ createBrowserClient }))

vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    supabaseUrl: 'https://abcdefgh.supabase.co',
    supabaseAnonKey: 'anon-key',
  },
}))

const { useDb, onDbClientCreated, __resetDbClientForTests } = await import('@shared/api/supabase/client')
const { fetchWithRetry } = await import('@shared/api/supabase/fetch-with-retry')

describe('useDb', () => {
  beforeEach(() => {
    __resetDbClientForTests()
    createBrowserClient.mockClear()
  })

  it('does not create a client until first use', () => {
    expect(createBrowserClient).not.toHaveBeenCalled()
  })

  it('creates a single client with session-compatible options', () => {
    const first = useDb()
    const second = useDb()

    expect(first).toBe(second)
    expect(createBrowserClient).toHaveBeenCalledTimes(1)
    expect(createBrowserClient).toHaveBeenCalledWith('https://abcdefgh.supabase.co', 'anon-key', {
      auth: { flowType: 'pkce' },
      cookieOptions: {
        name: 'sb-abcdefgh-auth-token',
        maxAge: 60 * 60 * 8,
        sameSite: 'lax',
        secure: true,
      },
      isSingleton: true,
      global: { fetch: fetchWithRetry },
    })
  })
})

describe('onDbClientCreated', () => {
  beforeEach(() => {
    __resetDbClientForTests()
  })

  it('runs callbacks registered before creation once, when the client is created', () => {
    const callback = vi.fn()
    onDbClientCreated(callback)
    expect(callback).not.toHaveBeenCalled()

    const client = useDb()
    useDb()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(client)
  })

  it('runs callbacks registered after creation immediately and only once', () => {
    const client = useDb()
    const callback = vi.fn()

    onDbClientCreated(callback)
    useDb()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(client)
  })
})
