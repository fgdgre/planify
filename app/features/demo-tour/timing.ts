/**
 * The tour's tempo. The old hand-made demo felt friendly because every action
 * had room to land; these are those beats, in one place so pacing is tuned here.
 */
export const CURSOR_TRAVEL_MS = 700
export const CLICK_BEAT_MS = 220
export const SIDEBAR_SETTLE_MS = 400
export const CLOSE_SETTLE_MS = 300
export const STEP_SETTLE_MS = 250
export const BEFORE_SAVE_MS = 600
export const AFTER_SAVE_MS = 700
export const GLOW_HOLD_MS = 1200
export const TYPE_CHAR_MS = 110
export const TYPE_JITTER_MS = 30

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
 * visitor would: a steady rhythm with a little jitter so it does not look
 * mechanical. With reduced motion the whole text is written at once.
 */
export async function typeText(
  text: string,
  write: (value: string) => void,
  {
    signal,
    reducedMotion,
    charDelayMs = TYPE_CHAR_MS,
    jitterMs = TYPE_JITTER_MS,
    random = Math.random,
  }: { signal: AbortSignal; reducedMotion: boolean; charDelayMs?: number; jitterMs?: number; random?: () => number },
): Promise<void> {
  if (reducedMotion) {
    throwIfAborted(signal)
    write(text)
    return
  }

  for (let length = 1; length <= text.length; length++) {
    throwIfAborted(signal)
    write(text.slice(0, length))
    if (length < text.length) await sleep(charDelayMs + (random() * 2 - 1) * jitterMs, signal)
  }
}
