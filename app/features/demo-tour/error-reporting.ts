import type { NuxtApp } from '#app'
import { describeError } from '@shared/api/demo'
import { getLandingWindow, sendToLanding } from './landing-window'

const MAX_REPORTS = 10
/** Browsers report this harmless layout notification as an error event. */
const BENIGN_ERROR = /ResizeObserver loop/

/**
 * Tells the landing page about anything that breaks inside the demo (uncaught
 * errors, rejected promises, Nuxt and Vue errors) so it can fall back instead
 * of showing a broken app. Capped, so an error loop cannot flood the host.
 */
export function reportDemoErrors(nuxtApp: Pick<NuxtApp, 'hook'>): void {
  const landing = getLandingWindow()
  if (!landing) return

  let reported = 0
  const report = (error: unknown) => {
    const reason = describeError(error)
    if (reported >= MAX_REPORTS || BENIGN_ERROR.test(reason)) return

    reported++
    sendToLanding(landing, { type: 'error', reason })
  }

  window.addEventListener('error', (event) => report(event.error ?? event.message))
  window.addEventListener('unhandledrejection', (event) => report(event.reason))
  nuxtApp.hook('app:error', report)
  nuxtApp.hook('vue:error', report)
}
