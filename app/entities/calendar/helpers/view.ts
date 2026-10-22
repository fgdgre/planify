/** The slice of Schedule-X's internal state used to switch views. */
interface CalendarViewState {
  setView?: (view: string, date: Temporal.PlainDate) => void
}

/**
 * Switches the calendar to the week view around `date`.
 *
 * Schedule-X 3.7 has no public call for this without the extra calendar-controls
 * plugin, so it goes through the app's internal state. It throws when that state
 * is missing (a Schedule-X upgrade changed it) so callers fail loudly instead of
 * silently doing nothing.
 */
export function showWeekView(calendarApp: unknown, date: Temporal.PlainDate): void {
  const state = (calendarApp as { $app?: { calendarState?: CalendarViewState } }).$app?.calendarState

  if (typeof state?.setView !== 'function') {
    throw new Error('Calendar view control is unavailable (Schedule-X internals changed)')
  }

  state.setView('week', date)
}
