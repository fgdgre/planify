/** First hour of the working day; the time grid opens with this row at the top. */
export const WORKING_HOURS_START = 7

/** Hours rendered by the time grid (matches the full-day `dayBoundaries`). */
export const GRID_HOURS = 24

/** Frames to wait for Schedule-X (Preact) to render the grid before giving up. */
const MAX_RENDER_FRAMES = 20

/** Overflow-enabled and actually overflowing (not just `overflow: auto`). */
const isScrollable = (el: HTMLElement): boolean =>
  /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight

/**
 * Schedule-X's own `.sx__view-container` is `overflow: auto` but sized to its
 * content, so it never scrolls. The element that really scrolls the grid is
 * whichever ancestor the host page constrained; find it instead of hard-coding
 * the page's wrapper.
 */
const findScrollParent = (el: HTMLElement): HTMLElement | null => {
  for (let parent = el.parentElement; parent; parent = parent.parentElement) {
    if (isScrollable(parent)) return parent
  }
  return null
}

/**
 * Scrolls the time grid's scroll container so `hour` is the first visible
 * row. Schedule-X has no built-in way to do this, and its week grid height
 * is a CSS variable, so the hour height is measured from the rendered grid
 * rather than assumed. The sticky header stays put, so the offset is simply
 * `hour` hour-heights.
 *
 * Returns false when there was nothing to scroll (month views, or the grid
 * is not laid out yet) so callers can retry on a later frame.
 */
export function scrollWeekGridToHour(
  root: HTMLElement | undefined,
  hour: number = WORKING_HOURS_START,
  hoursInGrid: number = GRID_HOURS,
): boolean {
  const grid = root?.querySelector<HTMLElement>('.sx__week-grid')
  const container = grid && findScrollParent(grid)
  if (!grid || !container || grid.offsetHeight === 0) return false

  container.scrollTop = (grid.offsetHeight / hoursInGrid) * hour
  return true
}

/**
 * Scrolls to working hours once the grid for the current view/date has been
 * rendered. Schedule-X fires its range/render callbacks before Preact paints,
 * so this polls on animation frames (bounded) instead of scrolling too early.
 * Runs only when called, i.e. on first render and view/date changes, so the
 * user's own scrolling is never overridden in between.
 */
export function scrollToWorkingHoursWhenRendered(getRoot: () => HTMLElement | undefined): void {
  let frames = 0
  const attempt = () => {
    if (scrollWeekGridToHour(getRoot())) return
    if (++frames < MAX_RENDER_FRAMES) requestAnimationFrame(attempt)
  }
  requestAnimationFrame(attempt)
}
