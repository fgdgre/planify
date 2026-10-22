import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { parseDemoMessage, toLandingMessage, type TourStep } from '@shared/api/demo/director-protocol'

/** How long the demo gets to report `ready` before the landing gives up and keeps the poster. */
export const READY_TIMEOUT_MS = 8000

/**
 * A step is sent to the demo only after it has been the active step this long,
 * so a quick scroll skips the steps it flies past instead of running them all.
 */
export const STEP_DEBOUNCE_MS = 350

/** The iframe is only requested when it is within this many viewports of the section. */
const LOAD_MARGIN = '100% 0px'

type Status = 'poster' | 'loading' | 'ready' | 'fallback'

interface DemoFrameOptions {
  /** Element whose proximity to the viewport triggers loading. */
  section: Ref<HTMLElement | null>
  frame: Ref<HTMLIFrameElement | null>
  /** False on small screens or when the visitor asked to save data: the poster stays. */
  enabled: Ref<boolean>
  demoUrl: string
}

/** Runs `callback` once the browser is idle, so the iframe never competes with first paint. */
function whenIdle(callback: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(callback, { timeout: 3000 })
    return () => cancelIdleCallback(handle)
  }
  const handle = setTimeout(callback, 200)
  return () => clearTimeout(handle)
}

/**
 * Lifecycle and messaging of the embedded demo iframe.
 *
 * The landing only knows the postMessage protocol, never the app: it loads the
 * iframe lazily, waits for `ready`, forwards the scroll step, and falls back to
 * the static poster for the rest of the visit when anything goes wrong (`error`,
 * `step-failed`, no `ready` in time) so the demo can never break silently.
 */
export function useDemoFrame({ section, frame, enabled, demoUrl }: DemoFrameOptions) {
  const status = ref<Status>('poster')
  const iframeSrc = ref<string | null>(null)
  const controlled = ref(false)
  let currentStep: TourStep = 1
  /** The step the demo was last asked to play; asking again would restart a step that is already on screen. */
  let sentStep: TourStep | null = null
  let stepTimer: ReturnType<typeof setTimeout> | undefined
  let observer: IntersectionObserver | undefined
  let cancelIdle: (() => void) | undefined
  let readyTimer: ReturnType<typeof setTimeout> | undefined

  const post = (body: Parameters<typeof toLandingMessage>[0]) =>
    frame.value?.contentWindow?.postMessage(toLandingMessage(body), '*')

  const sendStep = (step: TourStep) => {
    sentStep = step
    post({ type: 'step', step })
  }

  function stopWaiting() {
    observer?.disconnect()
    cancelIdle?.()
    clearTimeout(readyTimer)
    clearTimeout(stepTimer)
  }

  function fallBack() {
    stopWaiting()
    status.value = 'fallback'
    iframeSrc.value = null
    controlled.value = false
  }

  function load() {
    if (status.value !== 'poster') return
    status.value = 'loading'
    iframeSrc.value = demoUrl
    readyTimer = setTimeout(fallBack, READY_TIMEOUT_MS)
  }

  function onSectionNear() {
    observer?.disconnect()
    cancelIdle = whenIdle(load)
  }

  function onMessage(event: MessageEvent) {
    if (!frame.value || event.source !== frame.value.contentWindow) return
    const message = parseDemoMessage(event.data)
    if (!message) return

    switch (message.type) {
      case 'ready':
        if (status.value !== 'loading') return
        clearTimeout(readyTimer)
        status.value = 'ready'
        sendStep(currentStep)
        break
      case 'user-took-control':
        if (status.value === 'ready') controlled.value = true
        clearTimeout(stepTimer)
        break
      case 'error':
      case 'step-failed':
        fallBack()
        break
    }
  }

  /**
   * Follows the scroll tour: the step is sent once it has stayed active for
   * `STEP_DEBOUNCE_MS`, and never again while it is the one already playing.
   * While the visitor is in control the step is only remembered.
   */
  function goToStep(step: TourStep) {
    currentStep = step
    clearTimeout(stepTimer)
    if (status.value !== 'ready' || controlled.value || step === sentStep) return

    stepTimer = setTimeout(() => {
      if (status.value === 'ready' && !controlled.value && currentStep === step) sendStep(step)
    }, STEP_DEBOUNCE_MS)
  }

  /** The visitor chose to use the demo themselves: pause the tour on both sides of the frame. */
  function takeControl() {
    if (status.value !== 'ready' || controlled.value) return
    controlled.value = true
    clearTimeout(stepTimer)
    post({ type: 'take-control' })
  }

  function resume() {
    if (status.value !== 'ready') return
    controlled.value = false
    clearTimeout(stepTimer)
    post({ type: 'resume' })
    sendStep(currentStep)
  }

  onMounted(() => {
    window.addEventListener('message', onMessage)

    watch(
      enabled,
      (isEnabled) => {
        observer?.disconnect()
        if (!isEnabled || status.value !== 'poster' || !section.value) return
        observer = new IntersectionObserver(
          (entries) => entries.some((entry) => entry.isIntersecting) && onSectionNear(),
          { rootMargin: LOAD_MARGIN },
        )
        observer.observe(section.value)
      },
      { immediate: true },
    )
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage)
    stopWaiting()
  })

  return { status, iframeSrc, controlled, goToStep, takeControl, resume }
}
