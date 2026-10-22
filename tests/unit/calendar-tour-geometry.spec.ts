import { beforeEach, describe, expect, it } from 'vitest'
import { findEventElement, findSlotPoint } from '@entities/calendar/helpers/tour-geometry'

const rect = (left: number, top: number, width: number, height: number): DOMRect =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) })

let root: HTMLElement

beforeEach(() => {
  root = document.createElement('div')
  root.getBoundingClientRect = () => rect(0, 0, 1000, 600)
})

const addDay = (date: string, box: DOMRect) => {
  const column = document.createElement('div')
  column.dataset.timeGridDate = date
  column.getBoundingClientRect = () => box
  root.append(column)
  return column
}

describe('findSlotPoint', () => {
  // A 24h column 2400px tall starting 1000px above the viewport: 14:00 is 1400px down, i.e. y = 400 (+ a small offset into the slot).
  it('places the time as a fraction of the day column', () => {
    addDay('2026-10-22', rect(400, -1000, 100, 2400))

    const point = findSlotPoint(root, new Date(2026, 9, 22, 14, 0))

    expect(point).toEqual({ x: 435, y: 408 })
  })

  it('is null when the slot is scrolled out of view', () => {
    addDay('2026-10-22', rect(400, 0, 100, 2400))

    expect(findSlotPoint(root, new Date(2026, 9, 22, 14, 0))).toBeNull()
  })

  it('is null when that day is not rendered', () => {
    addDay('2026-10-21', rect(400, 0, 100, 2400))

    expect(findSlotPoint(root, new Date(2026, 9, 22, 9, 0))).toBeNull()
  })
})

describe('findEventElement', () => {
  it('finds a rendered event by id', () => {
    const event = document.createElement('div')
    event.dataset.eventId = 'abc"1'
    root.append(event)

    expect(findEventElement(root, 'abc"1')).toBe(event)
    expect(findEventElement(root, 'missing')).toBeNull()
    expect(findEventElement(undefined, 'abc')).toBeNull()
  })
})
