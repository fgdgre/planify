import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWithRetry } from '@shared/api/supabase/fetch-with-retry'

describe('fetchWithRetry', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('retries twice and then succeeds', async () => {
    const response = new Response('ok')
    fetchMock
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(response)

    const pending = fetchWithRetry('https://x.test/a')
    await vi.runAllTimersAsync()

    await expect(pending).resolves.toBe(response)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('rethrows the last error after three failed attempts', async () => {
    fetchMock.mockRejectedValue(new Error('down'))

    const pending = fetchWithRetry('https://x.test/a')
    const assertion = expect(pending).rejects.toThrow('down')
    await vi.runAllTimersAsync()

    await assertion
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('rethrows immediately when the request was aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))

    await expect(fetchWithRetry('https://x.test/a', { signal: controller.signal })).rejects.toThrow('aborted')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
