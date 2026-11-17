import { describe, expect, it } from 'vitest'
import { canAutoFocus } from '@shared/lib/auto-focus'

const topWindow = () => {
  const win = { navigator: {} } as { self?: unknown; top?: unknown; navigator: { userActivation?: { hasBeenActive: boolean } } }
  win.self = win
  win.top = win
  return win
}

const framedWindow = (userActivation?: { hasBeenActive: boolean }) => ({
  self: {},
  top: {},
  navigator: { userActivation },
})

describe('canAutoFocus', () => {
  it('allows auto focus in a top-level page', () => {
    expect(canAutoFocus(topWindow() as unknown as Window)).toBe(true)
  })

  it('blocks auto focus in a frame the visitor has not interacted with', () => {
    expect(canAutoFocus(framedWindow({ hasBeenActive: false }) as unknown as Window)).toBe(false)
  })

  it('allows auto focus in a frame once the visitor has interacted with it', () => {
    expect(canAutoFocus(framedWindow({ hasBeenActive: true }) as unknown as Window)).toBe(true)
  })

  it('blocks auto focus in a frame when user activation is not supported', () => {
    expect(canAutoFocus(framedWindow() as unknown as Window)).toBe(false)
  })
})
