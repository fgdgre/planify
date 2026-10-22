import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { parseDemoMessage, toLandingMessage, type TourStep } from '@shared/api/demo/director-protocol'

/** How long the demo gets to report `ready` before the landing gives up and keeps the poster. */
export const READY_TIMEOUT_MS = 8000

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
  let observer: IntersectionObserver | undefined
  let cancelIdle: (() => void) | undefined
  let readyTimer: ReturnType<typeof setTimeout> | undefined

  const post = (body: Parameters<typeof toLandingMessage>[0]) =>
    frame.value?.contentWindow?.postMessage(toLandingMessage(body), '*')

  function stopWaiting() {
    observer?.disconnect()
    cancelIdle?.()
    clearTimeout(readyTimer)
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
        post({ type: 'step', step: currentStep })
        break
      case 'user-took-control':
        if (status.value === 'ready') controlled.value = true
        break
      case 'error':
      case 'step-failed':
        fallBack()
        break
    }
  }

  /** Follows the scroll tour. While the visitor is in control the step is only remembered. */
  function goToStep(step: TourStep) {
    currentStep = step
    if (status.value === 'ready' && !controlled.value) post({ type: 'step', step })
  }

  function resume() {
    if (status.value !== 'ready') return
    controlled.value = false
    post({ type: 'resume' })
    post({ type: 'step', step: currentStep })
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

  return { status, iframeSrc, controlled, goToStep, resume }
}
