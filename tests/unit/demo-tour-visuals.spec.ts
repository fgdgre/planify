import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTourVisuals } from '@features/demo-tour/visuals'

const element = (left = 10, top = 20, width = 100, height = 40) => {
  const el = document.createElement('div')
  el.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) })
  return el
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('tour visuals', () => {
  it('shows the cursor at the point it is sent to', () => {
    const { state, visuals } = createTourVisuals(false)
    expect(state.cursor.visible).toBe(false)

    visuals.moveCursorTo({ x: 30, y: 40 })

    expect(state.cursor).toMatchObject({ x: 30, y: 40, visible: true })
  })

  it('rings the click where the cursor is and removes the ring afterwards', () => {
    const { state, visuals } = createTourVisuals(false)
    visuals.moveCursorTo({ x: 30, y: 40 })
    visuals.ripple()

    expect(state.ripples).toMatchObject([{ x: 30, y: 40 }])
    vi.advanceTimersByTime(1000)
    expect(state.ripples).toEqual([])
  })

  it('draws the glow around the element with a little room, and fades it on clear', () => {
    const { state, visuals } = createTourVisuals(false)
    visuals.glow(element(10, 20, 100, 40))

    expect(state.glow).toEqual({ x: 4, y: 14, width: 112, height: 52, visible: true })
    visuals.clearGlow()
    expect(state.glow?.visible).toBe(false)
  })

  it('keeps the glow inside the window when the element fills it', () => {
    const { state, visuals } = createTourVisuals(false)
    visuals.glow(element(0, 0, window.innerWidth, window.innerHeight))

    expect(state.glow).toMatchObject({ x: 4, y: 4, width: window.innerWidth - 8, height: window.innerHeight - 8 })
  })

  it('pulses an element once', () => {
    const { state, visuals } = createTourVisuals(false)
    visuals.pulse(element())
    expect(state.pulses).toHaveLength(1)

    vi.advanceTimersByTime(2000)
    expect(state.pulses).toEqual([])
  })

  it('hide removes everything at once', () => {
    const { state, visuals } = createTourVisuals(false)
    visuals.moveCursorTo({ x: 1, y: 2 })
    visuals.ripple()
    visuals.glow(element())
    visuals.pulse(element())

    visuals.hide()

    expect(state.cursor.visible).toBe(false)
    expect(state.ripples).toEqual([])
    expect(state.pulses).toEqual([])
    expect(state.glow?.visible).toBe(false)
  })

  it('with reduced motion there is no cursor, ripple or pulse, only the static glow', () => {
    const { state, visuals } = createTourVisuals(true)
    visuals.moveCursorTo({ x: 30, y: 40 })
    visuals.ripple()
    visuals.pulse(element())
    visuals.glow(element())

    expect(state.cursor.visible).toBe(false)
    expect(state.ripples).toEqual([])
    expect(state.pulses).toEqual([])
    expect(state.glow?.visible).toBe(true)
    expect(state.reducedMotion).toBe(true)
  })
})
