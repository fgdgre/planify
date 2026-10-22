/**
 * postMessage contract between the landing page (host) and the demo app running
 * in its sandboxed iframe. The iframe has an opaque origin, so neither side can
 * check `event.origin`: the receivers verify the sender window and the message
 * shape instead, and senders use targetOrigin '*'. Bump `PROTOCOL_VERSION` on
 * any breaking change; receivers ignore other versions.
 */
export const PROTOCOL_VERSION = 1

export const LANDING_SOURCE = 'planify-landing'
export const DEMO_SOURCE = 'planify-demo'

export const TOUR_STEPS = [1, 2, 3, 4, 5] as const
export type TourStep = (typeof TOUR_STEPS)[number]

interface Envelope<S extends string> {
  source: S
  version: typeof PROTOCOL_VERSION
}

export type LandingMessage =
  | (Envelope<typeof LANDING_SOURCE> & { type: 'step'; step: TourStep })
  | (Envelope<typeof LANDING_SOURCE> & { type: 'resume' })

export type DemoMessage =
  | (Envelope<typeof DEMO_SOURCE> & { type: 'ready' })
  | (Envelope<typeof DEMO_SOURCE> & { type: 'user-took-control' })
  | (Envelope<typeof DEMO_SOURCE> & { type: 'step-done'; step: TourStep })
  | (Envelope<typeof DEMO_SOURCE> & { type: 'step-failed'; step: TourStep; reason: string })
  | (Envelope<typeof DEMO_SOURCE> & { type: 'error'; reason: string })

/** Message bodies as callers write them; `source` and `version` are added by `toDemoMessage`. */
export type DemoMessageBody = DemoMessage extends infer M
  ? M extends DemoMessage ? Omit<M, 'source' | 'version'> : never
  : never

export type LandingMessageBody = LandingMessage extends infer M
  ? M extends LandingMessage ? Omit<M, 'source' | 'version'> : never
  : never

export const isTourStep = (value: unknown): value is TourStep =>
  typeof value === 'number' && (TOUR_STEPS as readonly number[]).includes(value)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** Narrows untrusted `event.data` to a landing-to-demo message, or returns null. */
export function parseLandingMessage(data: unknown): LandingMessage | null {
  if (!isRecord(data) || data.source !== LANDING_SOURCE || data.version !== PROTOCOL_VERSION) return null

  if (data.type === 'resume') return { source: LANDING_SOURCE, version: PROTOCOL_VERSION, type: 'resume' }
  if (data.type === 'step' && isTourStep(data.step)) {
    return { source: LANDING_SOURCE, version: PROTOCOL_VERSION, type: 'step', step: data.step }
  }

  return null
}

/** Narrows untrusted `event.data` to a demo-to-landing message, or returns null. */
export function parseDemoMessage(data: unknown): DemoMessage | null {
  if (!isRecord(data) || data.source !== DEMO_SOURCE || data.version !== PROTOCOL_VERSION) return null

  const base = { source: DEMO_SOURCE, version: PROTOCOL_VERSION } as const

  switch (data.type) {
    case 'ready':
    case 'user-took-control':
      return { ...base, type: data.type }
    case 'step-done':
      return isTourStep(data.step) ? { ...base, type: 'step-done', step: data.step } : null
    case 'step-failed':
      return isTourStep(data.step) && typeof data.reason === 'string'
        ? { ...base, type: 'step-failed', step: data.step, reason: data.reason }
        : null
    case 'error':
      return typeof data.reason === 'string' ? { ...base, type: 'error', reason: data.reason } : null
    default:
      return null
  }
}

export const toDemoMessage = (body: DemoMessageBody): DemoMessage =>
  ({ source: DEMO_SOURCE, version: PROTOCOL_VERSION, ...body }) as DemoMessage

export const toLandingMessage = (body: LandingMessageBody): LandingMessage =>
  ({ source: LANDING_SOURCE, version: PROTOCOL_VERSION, ...body }) as LandingMessage

/** Short, single-line text for error reports: never sends stacks or arbitrary objects across the frame. */
export function describeError(error: unknown): string {
  const text = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error'
  return text.slice(0, 300)
}
