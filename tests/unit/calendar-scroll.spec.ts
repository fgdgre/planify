import { describe, expect, it } from 'vitest'
import { scrollWeekGridToHour } from '../../app/entities/calendar/helpers/scroll'

const buildCalendar = (gridHeight: number) => {
  const root = document.createElement('div')
  root.innerHTML = '<div class="scroller" style="overflow-y: auto"><div class="sx__view-container"><div class="sx__week-grid"></div></div></div>'
  const container = root.querySelector<HTMLElement>('.scroller')!
  const grid = root.querySelector<HTMLElement>('.sx__week-grid')!
  Object.defineProperty(grid, 'offsetHeight', { value: gridHeight })
  Object.defineProperty(container, 'scrollHeight', { value: gridHeight })
  Object.defineProperty(container, 'clientHeight', { value: 800 })
  return { root, container }
}

describe('scrollWeekGridToHour', () => {
  it('scrolls the view container so the hour sits at the top of the grid', () => {
    const { root, container } = buildCalendar(2400)
    expect(scrollWeekGridToHour(root, 7, 24)).toBe(true)
    expect(container.scrollTop).toBe(700)
  })

  it('skips overflow:auto ancestors that do not actually overflow', () => {
    const { root, container } = buildCalendar(2400)
    const viewContainer = root.querySelector<HTMLElement>('.sx__view-container')!
    viewContainer.style.overflowY = 'auto'
    scrollWeekGridToHour(root, 7, 24)
    expect(viewContainer.scrollTop).toBe(0)
    expect(container.scrollTop).toBe(700)
  })

  it('does nothing when no time grid is rendered (month views)', () => {
    const root = document.createElement('div')
    root.innerHTML = '<div class="scroller" style="overflow-y: auto"><div class="sx__view-container"></div></div>'
    expect(scrollWeekGridToHour(root, 7, 24)).toBe(false)
  })

  it('does nothing before the grid has been laid out', () => {
    const { root, container } = buildCalendar(0)
    expect(scrollWeekGridToHour(root, 7, 24)).toBe(false)
    expect(container.scrollTop).toBe(0)
  })

  it('does nothing without a root element', () => {
    expect(scrollWeekGridToHour(undefined, 7, 24)).toBe(false)
  })
})
