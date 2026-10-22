import type { Router } from 'vue-router'
import { calendarControls, eventSidebarControls, useCalendarStore } from '@entities/calendar'
import { createTourDirector } from './director'
import { getLandingWindow, sendToLanding } from './landing-window'

/** Events that can only come from a visitor (`isTrusted` cannot be faked by a script). */
const VISITOR_EVENTS = ['pointerdown', 'keydown', 'wheel'] as const

/**
 * Wires the tour director to the real app and to the landing page that frames
 * it: message listener (accepted only from `window.parent`) and visitor-input
 * detection. Does nothing when the demo is opened on its own.
 */
export function startDemoDirector(router: Router): void {
  const landing = getLandingWindow()
  if (!landing) return

  const calendarStore = useCalendarStore()
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const director = createTourDirector({
    send: (message) => sendToLanding(landing, message),
    createEnv: (signal) => ({
      navigate: (location) => router.push(location),
      currentPath: () => router.currentRoute.value.path,
      calendar: () => calendarControls.value,
      eventSidebar: () => eventSidebarControls.value,
      events: () => calendarStore.events,
      setSearchQuery: calendarStore.setSearchQuery,
      now: () => new Date(),
      reducedMotion,
      signal,
    }),
  })

  window.addEventListener('message', (event) => {
    if (event.source !== landing) return
    director.handleLandingMessage(event.data)
  })

  for (const type of VISITOR_EVENTS) {
    window.addEventListener(type, (event) => {
      if (event.isTrusted) director.takeControlFromTour()
    }, { capture: true, passive: true })
  }

  director.reportReady()
}
