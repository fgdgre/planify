import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FunctionsHttpError, FunctionsFetchError } from '@supabase/supabase-js'

const invoke = vi.fn()
vi.mock('@shared/api/supabase', () => ({ useDb: () => ({ functions: { invoke }, auth: {} }) }))
vi.mock('@features/notification', () => ({
  useNotification: () => ({ showErrorToast: vi.fn(), showSuccessToast: vi.fn() }),
}))
vi.mock('@features/integrations/google-calendar/stores/google-calendar', () => ({
  useGoogleCalendarStore: () => ({}),
}))

const { useGoogleCalendar, EdgeFunctionError } = await import(
  '@features/integrations/google-calendar/composables/useGoogleCalendar'
)

const httpError = (status: number, payload: unknown) =>
  new FunctionsHttpError(new Response(typeof payload === 'string' ? payload : JSON.stringify(payload), { status }))

describe('edge function calls through the client', () => {
  beforeEach(() => {
    invoke.mockReset()
  })

  it('returns the payload of a successful call', async () => {
    invoke.mockResolvedValue({ data: { ok: true, account: { email: 'a@b.c', display_name: null } }, error: null })

    const account = await useGoogleCalendar().completeGoogleConnection('code-1', 'state-1')

    expect(account).toEqual({ email: 'a@b.c', display_name: null })
    expect(invoke).toHaveBeenCalledWith('google-oauth-complete', {
      method: 'POST',
      body: { code: 'code-1', state: 'state-1' },
    })
  })

  it('passes the query in the function name for GET calls', async () => {
    invoke.mockResolvedValue({ data: { url: 'https://accounts.google.com/x' }, error: null })
    vi.stubGlobal('location', { origin: 'https://planify.test', href: '' })

    await useGoogleCalendar().connectGoogle()

    expect(invoke).toHaveBeenCalledWith('google-oauth-start?app_origin=https%3A%2F%2Fplanify.test', {
      method: 'GET',
      body: undefined,
    })
    vi.unstubAllGlobals()
  })

  it('turns an HTTP error into EdgeFunctionError with the status and the server error code', async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(403, { error: 'access_denied' }) })

    const failure = await useGoogleCalendar().completeGoogleConnection('c', 's').catch((e) => e)

    expect(failure).toBeInstanceOf(EdgeFunctionError)
    expect(failure).toMatchObject({ status: 403, code: 'access_denied' })
  })

  it('falls back to request_failed when the error body is not JSON', async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(502, '<html>bad gateway</html>') })

    const failure = await useGoogleCalendar().completeGoogleConnection('c', 's').catch((e) => e)

    expect(failure).toMatchObject({ status: 502, code: 'request_failed' })
  })

  it('rethrows non-HTTP failures untouched', async () => {
    const networkError = new FunctionsFetchError(new TypeError('Failed to fetch'))
    invoke.mockResolvedValue({ data: null, error: networkError })

    await expect(useGoogleCalendar().completeGoogleConnection('c', 's')).rejects.toBe(networkError)
  })
})
