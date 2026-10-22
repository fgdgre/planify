import { describeError, parseLandingMessage, type DemoMessageBody, type TourStep } from '@shared/api/demo'
import { runTourStep, type TourEnv } from './steps'
import { TourAbortedError } from './timing'

export interface TourDirectorOptions {
  /** Builds the environment a step runs in; `signal` aborts it. */
  createEnv: (signal: AbortSignal) => TourEnv
  /** Delivers a message to the landing page. */
  send: (body: DemoMessageBody) => void
}

/**
 * Runs tour steps the landing page asks for, one at a time, and hands control
 * back the moment the visitor touches the demo.
 *
 * Never throws: a step that cannot run is reported as `step-failed` so the
 * landing can fall back instead of showing a half-driven app.
 */
export function createTourDirector({ createEnv, send }: TourDirectorOptions) {
  let hasControl = true
  let running: AbortController | null = null

  const post = send

  const abortRunning = () => {
    running?.abort()
    running = null
  }

  const runStep = async (step: TourStep) => {
    abortRunning()
    const controller = new AbortController()
    running = controller

    try {
      await runTourStep(step, createEnv(controller.signal))
      if (!controller.signal.aborted) post({ type: 'step-done', step })
    } catch (error) {
      if (error instanceof TourAbortedError || controller.signal.aborted) return
      post({ type: 'step-failed', step, reason: describeError(error) })
    } finally {
      if (running === controller) running = null
    }
  }

  /** The visitor interacted: stop driving the app until the landing sends `resume`. */
  const takeControlFromTour = () => {
    if (!hasControl) return

    hasControl = false
    abortRunning()
    post({ type: 'user-took-control' })
  }

  return {
    /** Handles an untrusted `MessageEvent.data` from the landing page. */
    handleLandingMessage(data: unknown) {
      const message = parseLandingMessage(data)
      if (!message) return

      if (message.type === 'resume') {
        hasControl = true
        return
      }

      if (message.type === 'take-control') {
        takeControlFromTour()
        return
      }

      if (hasControl) void runStep(message.step)
      else post({ type: 'step-ignored', step: message.step })
    },

    takeControlFromTour,

    reportReady: () => post({ type: 'ready' }),
  }
}
