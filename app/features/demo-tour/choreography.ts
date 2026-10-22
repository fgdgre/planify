import type { TourTarget } from '@shared/api/demo'
import type { Point, TourVisuals } from './visuals'
import {
  CLICK_BEAT_MS,
  CURSOR_TRAVEL_MS,
  GLOW_HOLD_MS,
  TourAbortedError,
  sleep,
  waitFor,
} from './timing'

/** What the choreography needs from the tour environment (a subset of `TourEnv`). */
export interface ChoreographyEnv {
  reducedMotion: boolean
  signal: AbortSignal
  visuals: TourVisuals
  target: (name: TourTarget) => HTMLElement | null
}

const centerOf = (element: HTMLElement): Point => {
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

const isOnScreen = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  return rect.top >= 0 && rect.bottom <= window.innerHeight
}

/** A pause between beats. Skipped with reduced motion, but still stops on abort. */
export async function beat(ms: number, env: Pick<ChoreographyEnv, 'reducedMotion' | 'signal'>): Promise<void> {
  if (env.reducedMotion) {
    if (env.signal.aborted) throw new TourAbortedError()
    return
  }
  await sleep(ms, env.signal)
}

/** Glides the ghost cursor onto `target` (an element or a point). A missing target only skips the visual. */
export async function glideTo(env: ChoreographyEnv, target: HTMLElement | Point | null): Promise<void> {
  if (!target) return
  env.visuals.moveCursorTo(target instanceof HTMLElement ? centerOf(target) : target)
  await beat(CURSOR_TRAVEL_MS, env)
}

/** Click ring, then a short beat so the click reads as the cause of what follows. */
export async function click(env: ChoreographyEnv): Promise<void> {
  env.visuals.ripple()
  await beat(CLICK_BEAT_MS, env)
}

/**
 * Brings `element` into view if needed, then rings it for `holdMs`. The ring
 * stays until the next step clears it.
 */
export async function highlight(env: ChoreographyEnv, element: HTMLElement | null, holdMs = GLOW_HOLD_MS): Promise<void> {
  if (!element) return

  if (!isOnScreen(element)) {
    element.scrollIntoView({ behavior: env.reducedMotion ? 'instant' : 'smooth', block: 'center' })
    await beat(700, env)
  }

  env.visuals.glow(element)
  await beat(holdMs, env)
}

/** One-off pulse on an element (a newly created event). */
export async function pulse(env: ChoreographyEnv, element: HTMLElement | null): Promise<void> {
  if (!element) return
  env.visuals.pulse(element)
  await beat(900, env)
}

/**
 * Like `waitFor`, but a timeout yields null instead of failing the step: used
 * for things that only decorate a step (targets to point at), never for what
 * the step needs to do.
 */
export async function findOptional<T>(
  read: () => T | null | undefined | false,
  env: Pick<ChoreographyEnv, 'signal'>,
  timeoutMs = 2000,
): Promise<T | null> {
  try {
    return await waitFor(read, { what: 'an optional target', signal: env.signal, timeoutMs })
  } catch (error) {
    if (error instanceof TourAbortedError) throw error
    return null
  }
}
