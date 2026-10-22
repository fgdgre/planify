import { onScopeDispose, shallowRef } from 'vue'
import type { Ref } from 'vue'
import type { Note } from '@features/notes'
import type { CalendarEventDisplay } from '../types'

/**
 * Handles that let a script (the landing-page demo tour) drive the calendar
 * and the event sidebar through typed calls instead of DOM events. Each
 * composable registers itself while its component is alive; the handle is
 * `null` whenever nothing is mounted, which the caller must treat as "not
 * ready yet".
 */

export interface CalendarControls {
  /** Switches Schedule-X to the week view around today. */
  showCurrentWeek: () => void
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

export const calendarControls: Ref<CalendarControls | null> = shallowRef(null)
export const eventSidebarControls: Ref<EventSidebarControls | null> = shallowRef(null)

/** Publishes `controls` in `handle` until the calling effect scope is disposed. */
export function registerControls<T extends object>(handle: Ref<T | null>, controls: T): void {
  handle.value = controls
  onScopeDispose(() => {
    if (handle.value === controls) handle.value = null
  })
}
