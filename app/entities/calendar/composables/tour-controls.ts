import { getCurrentScope, onScopeDispose, shallowRef } from 'vue'
import type { Ref } from 'vue'
import type { Note } from '@features/notes'
import type { CalendarEventDisplay } from '../types'

/**
 * Handles that let a script (the landing-page demo tour) drive the calendar
 * and the event sidebar through typed calls instead of DOM events. Each
 * composable registers itself while its component is alive (outside an effect
 * scope there is nothing to clean up, so the handle then stays); the handle is
 * `null` whenever nothing is mounted, which the caller must treat as "not
 * ready yet".
 */

/** A position in viewport pixels. */
export interface ScreenPoint {
  x: number
  y: number
}

export interface CalendarControls {
  /** Switches Schedule-X to the week view around today. */
  showCurrentWeek: () => void
  /** Where `date`'s time is in the week grid right now, or null when it is not on screen. */
  slotPoint: (date: Date) => ScreenPoint | null
  /** The rendered element of an event, or null when it is not on screen. */
  eventElement: (id: string) => HTMLElement | null
}

export interface EventSidebarControls {
  mode: 'view' | 'edit' | 'create' | null
  /** The event shown in view/edit mode, once it has loaded. */
  selectedEvent: CalendarEventDisplay | null
  /** Notes linked to the shown event, once they have loaded. */
  eventNotes: Note[]
  /** True while a save is in flight. */
  saving: boolean
  setTitle: (title: string) => void
  submit: () => Promise<void>
  openNote: (note: Note) => Promise<void>
}

export interface CalendarSearchControls {
  /** Fills the search box and shows its results, as if the visitor typed it. */
  setQuery: (value: string) => void
}

export const calendarSearchControls: Ref<CalendarSearchControls | null> = shallowRef(null)
export const calendarControls: Ref<CalendarControls | null> = shallowRef(null)
export const eventSidebarControls: Ref<EventSidebarControls | null> = shallowRef(null)

/** Publishes `controls` in `handle` until the calling effect scope is disposed. */
export function registerControls<T extends object>(handle: Ref<T | null>, controls: T): void {
  handle.value = controls
  if (!getCurrentScope()) return

  onScopeDispose(() => {
    if (handle.value === controls) handle.value = null
  })
}
