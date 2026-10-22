import type { ScreenPoint } from '../composables/tour-controls'

const pad = (value: number) => String(value).padStart(2, '0')

const toDateString = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const isInside = (point: ScreenPoint, rect: DOMRect) =>
  point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom

/**
 * Where `date`'s time sits in the rendered week grid, in viewport pixels, or
 * null when it is not on screen (other week, scrolled out, not rendered yet).
 *
 * Schedule-X lays each day out as a full-height column covering the whole
 * `dayBoundaries` range, so the vertical position is a plain fraction of it.
 */
export function findSlotPoint(root: HTMLElement | undefined, date: Date): ScreenPoint | null {
  const column = root?.querySelector<HTMLElement>(`[data-time-grid-date="${toDateString(date)}"]`)
  if (!root || !column) return null

  const rect = column.getBoundingClientRect()
  if (!rect.height) return null

  const dayFraction = (date.getHours() * 60 + date.getMinutes()) / (24 * 60)
  const point = { x: rect.left + rect.width * 0.35, y: rect.top + rect.height * dayFraction + 8 }

  return isInside(point, root.getBoundingClientRect()) ? point : null
}

/** The rendered element of calendar event `id`, if it is on screen. */
export function findEventElement(root: HTMLElement | undefined, id: string): HTMLElement | null {
  const escaped = id.replace(/["\\]/g, '\\$&')
  return root?.querySelector<HTMLElement>(`[data-event-id="${escaped}"]`) ?? null
}
