import { afterEach, describe, expect, it, vi } from 'vitest'
import { centerInScrollParent } from '@features/demo-tour/scroll'

const rect = (top: number, height: number) => ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) }) as DOMRect

const scrollable = (overflowY: string, { clientHeight, scrollHeight, scrollTop, top }: { clientHeight: number; scrollHeight: number; scrollTop: number; top: number }) => {
  const element = document.createElement('div')
  element.style.overflowY = overflowY
  Object.defineProperty(element, 'clientHeight', { value: clientHeight })
  Object.defineProperty(element, 'scrollHeight', { value: scrollHeight })
  element.scrollTop = scrollTop
  element.getBoundingClientRect = () => rect(top, clientHeight)
  element.scrollTo = vi.fn() as typeof element.scrollTo
  return element
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('centerInScrollParent', () => {
  it('centers the element inside its nearest scrollable ancestor', () => {
    const container = scrollable('auto', { clientHeight: 400, scrollHeight: 2000, scrollTop: 100, top: 50 })
    const target = document.createElement('div')
    target.getBoundingClientRect = () => rect(850, 100)
    container.appendChild(target)
    document.body.appendChild(container)

    centerInScrollParent(target, 'smooth')

    expect(container.scrollTo).toHaveBeenCalledWith({ top: 750, behavior: 'smooth' })
  })

  it('skips ancestors that hide overflow or have nothing to scroll', () => {
    const outer = scrollable('scroll', { clientHeight: 400, scrollHeight: 2000, scrollTop: 0, top: 0 })
    const clipped = scrollable('hidden', { clientHeight: 300, scrollHeight: 900, scrollTop: 0, top: 0 })
    const short = scrollable('auto', { clientHeight: 300, scrollHeight: 300, scrollTop: 0, top: 0 })
    const target = document.createElement('div')
    target.getBoundingClientRect = () => rect(600, 100)
    short.appendChild(target)
    clipped.appendChild(short)
    outer.appendChild(clipped)
    document.body.appendChild(outer)

    centerInScrollParent(target, 'instant')

    expect(short.scrollTo).not.toHaveBeenCalled()
    expect(clipped.scrollTo).not.toHaveBeenCalled()
    expect(outer.scrollTo).toHaveBeenCalledWith({ top: 450, behavior: 'instant' })
  })

  it('falls back to the document of its own frame and never scrolls below zero', () => {
    const target = document.createElement('div')
    target.getBoundingClientRect = () => rect(10, 20)
    document.body.appendChild(target)
    const scrollingElement = document.scrollingElement ?? document.documentElement
    const scrollTo = vi.fn()
    scrollingElement.scrollTo = scrollTo as typeof scrollingElement.scrollTo
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)

    centerInScrollParent(target, 'smooth')

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })
})
