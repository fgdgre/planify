import { reactive } from 'vue'
export interface Point {
  x: number
  y: number
}

interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Everything the overlay draws, in viewport pixels. Mutated only through `TourVisuals`. */
export interface OverlayState {
  cursor: Point & { visible: boolean }
  /** Short-lived click rings and event pulses; the overlay just renders what is here. */
  ripples: Array<Point & { id: number }>
  pulses: Array<Box & { id: number }>
  glow: (Box & { visible: boolean }) | null
  /** No travel, ripple or pulse; the glow is shown without animation. */
  reducedMotion: boolean
}

/**
 * What the tour can show on top of the demo. The director only ever talks to
 * this interface, so its choreography is testable without a DOM.
 */
export interface TourVisuals {
  /** Glides the ghost cursor to `point`; the caller waits `CURSOR_TRAVEL_MS` (see timing.ts). */
  moveCursorTo: (point: Point) => void
  /** Click ring at the cursor. */
  ripple: () => void
  /** Soft ring that follows the element's current bounds (replaces the previous one). */
  glow: (element: HTMLElement) => void
  clearGlow: () => void
  /** One-off attention ring around a freshly created element. */
  pulse: (element: HTMLElement) => void
  /** Hides cursor, glow and rings at once (the visitor took over). */
  hide: () => void
}

const RIPPLE_MS = 650
const PULSE_MS = 1100
const GLOW_PADDING = 6
const EDGE_MARGIN = 4

/** Where the cursor first appears: low on the right, out of the way of the content. */
const startPoint = (): Point => ({ x: window.innerWidth * 0.7, y: window.innerHeight * 0.8 })

const boxOf = (element: HTMLElement, padding: number): Box => {
  const rect = element.getBoundingClientRect()
  return { x: rect.left - padding, y: rect.top - padding, width: rect.width + padding * 2, height: rect.height + padding * 2 }
}

/** Keeps a ring inside the window: one that hugs the edge of a full-size panel would be cut off there. */
const insideViewport = (box: Box): Box => {
  const left = Math.max(box.x, EDGE_MARGIN)
  const top = Math.max(box.y, EDGE_MARGIN)
  const right = Math.min(box.x + box.width, window.innerWidth - EDGE_MARGIN)
  const bottom = Math.min(box.y + box.height, window.innerHeight - EDGE_MARGIN)
  return { x: left, y: top, width: Math.max(right - left, 0), height: Math.max(bottom - top, 0) }
}

/** Creates the overlay state and the commands that drive it. */
export function createTourVisuals(reducedMotion: boolean): { state: OverlayState; visuals: TourVisuals } {
  const state = reactive<OverlayState>({
    cursor: { ...startPoint(), visible: false },
    ripples: [],
    pulses: [],
    glow: null,
    reducedMotion,
  })

  let nextId = 0
  const timers = new Set<ReturnType<typeof setTimeout>>()

  const expireLater = (ms: number, remove: () => void) => {
    const timer = setTimeout(() => {
      timers.delete(timer)
      remove()
    }, ms)
    timers.add(timer)
  }

  const visuals: TourVisuals = {
    moveCursorTo(point) {
      if (reducedMotion) return
      state.cursor.x = point.x
      state.cursor.y = point.y
      state.cursor.visible = true
    },

    ripple() {
      if (reducedMotion || !state.cursor.visible) return
      const ripple = { id: nextId++, x: state.cursor.x, y: state.cursor.y }
      state.ripples.push(ripple)
      expireLater(RIPPLE_MS, () => { state.ripples = state.ripples.filter((r) => r.id !== ripple.id) })
    },

    glow(element) {
      state.glow = { ...insideViewport(boxOf(element, GLOW_PADDING)), visible: true }
    },

    clearGlow() {
      if (state.glow) state.glow.visible = false
    },

    pulse(element) {
      if (reducedMotion) return
      const pulse = { id: nextId++, ...boxOf(element, 0) }
      state.pulses.push(pulse)
      expireLater(PULSE_MS, () => { state.pulses = state.pulses.filter((p) => p.id !== pulse.id) })
    },

    hide() {
      timers.forEach(clearTimeout)
      timers.clear()
      state.cursor.visible = false
      state.ripples = []
      state.pulses = []
      visuals.clearGlow()
    },
  }

  return { state, visuals }
}
