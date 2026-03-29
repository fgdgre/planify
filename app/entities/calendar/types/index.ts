export interface ViewDateRange {
  start: string // ISO string
  end: string   // ISO string
}

/**
 * Provider-agnostic calendar event used throughout the calendar entity.
 * Features (e.g. google-calendar) map their provider-specific types into this shape.
 */
export interface CalendarEventDisplay {
  id: string
  title: string
  start_at: string
  end_at: string
  all_day: boolean
  description?: string
  location?: string
  creator_email?: string
  /** Identifier used to assign per-account colors in ScheduleX */
  sourceAccountId?: string
}
