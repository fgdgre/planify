import { shallowReactive, watchEffect } from 'vue'
import type { Ref } from 'vue'
import { isDemoMode } from './demo-mode'

/**
 * Things the demo tour may point at (ghost cursor, glow). Components publish
 * their own element under one of these names, so the tour never needs a CSS
 * selector and a markup change cannot silently break it: a missing target just
 * means the visual is skipped.
 */
export type TourTarget =
  | 'calendarGrid'
  | 'searchBox'
  | 'searchResults'
  | 'sidebarSubmit'
  | 'eventNotes'
  | 'dashboardNav'
  | 'statsRow'

const elements = shallowReactive<Partial<Record<TourTarget, HTMLElement>>>({})

/** A template ref: an element, or a component instance (resolved to its root element). Typed loosely because component ref types are huge unions. */
type TargetSource = Readonly<Ref<unknown>>

const toElement = (source: unknown): HTMLElement | null => {
  if (source instanceof HTMLElement) return source
  const root = (source as { $el?: unknown } | null)?.$el
  return root instanceof HTMLElement ? root : null
}

/** The element currently published as `name`, if any. */
export const getTourTarget = (name: TourTarget): HTMLElement | null => elements[name] ?? null

/**
 * Publishes the element behind a template ref as tour target `name` for as
 * long as it is mounted. Does nothing outside demo mode, so the real app pays
 * no cost. Component refs resolve to their root element.
 */
export function useTourTarget(name: TourTarget, source: TargetSource): void {
  if (!isDemoMode()) return

  watchEffect((onCleanup) => {
    const el = toElement(source.value)
    if (!el) return

    elements[name] = el
    onCleanup(() => {
      if (elements[name] === el) delete elements[name]
    })
  }, { flush: 'post' })
}
