/** Thrown when a step is cancelled (visitor took control, or a newer step started). */
export class TourAbortedError extends Error {
  constructor() {
    super('Tour step aborted')
    this.name = 'TourAbortedError'
  }
}

const throwIfAborted = (signal: AbortSignal) => {
  if (signal.aborted) throw new TourAbortedError()
}

/** Resolves after `ms`; rejects with `TourAbortedError` as soon as `signal` aborts. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    throwIfAborted(signal)

    const onAbort = () => {
      clearTimeout(timer)
      reject(new TourAbortedError())
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Polls `read` until it returns something other than `null`/`undefined`/`false`,
 * and returns that value. Used to wait for app state (a handle registering, a
 * request finishing) without coupling to rendering internals. Throws a plain
 * Error naming `what` on timeout so the failure reason reaches the landing.
 */
export async function waitFor<T>(
  read: () => T | null | undefined | false,
  { what, signal, timeoutMs = 8000, pollMs = 40 }: { what: string; signal: AbortSignal; timeoutMs?: number; pollMs?: number },
): Promise<T> {
  const deadline = Date.now() + timeoutMs

  for (;;) {
    throwIfAborted(signal)

    const value = read()
    if (value !== null && value !== undefined && value !== false) return value
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${what}`)

    await sleep(pollMs, signal)
  }
}

/**
 * Types `text` into a field one character at a time through `write`, like a
 * visitor would. With reduced motion the whole text is written at once.
 */
export async function typeText(
  text: string,
  write: (value: string) => void,
  { signal, reducedMotion, charDelayMs = 80 }: { signal: AbortSignal; reducedMotion: boolean; charDelayMs?: number },
): Promise<void> {
  if (reducedMotion) {
    throwIfAborted(signal)
    write(text)
    return
  }

  for (let length = 1; length <= text.length; length++) {
    throwIfAborted(signal)
    write(text.slice(0, length))
    if (length < text.length) await sleep(charDelayMs, signal)
  }
}
