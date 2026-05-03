import type { CalendarEventDisplay } from '../types'
import type { CalendarEventExternal } from '@schedule-x/calendar'
import type { Database } from '@shared/api/supabase/types/database'

type CalendarEventRow = Database['public']['Tables']['calendar_events']['Row']

export const parseTemporalStart = (dateString: string, allDay: boolean) => {
  if (allDay) {
    return Temporal.PlainDate.from(dateString.slice(0, 10))
  }

  const instant = Temporal.Instant.from(dateString)
  return instant.toZonedDateTimeISO(Temporal.Now.timeZoneId())
}

export const mapToScheduleXEvent = (event: CalendarEventDisplay): CalendarEventExternal => {
  const isReadOnly = event.source !== 'internal'

  return {
    id: event.id,
    start: parseTemporalStart(event.start_at, event.all_day),
    end: parseTemporalStart(event.end_at, event.all_day),
    title: event.title,
    description: event.description,
    location: event.location,
    calendarId: event.sourceAccountId,
    _options: {
      disableDND: isReadOnly,
      disableResize: isReadOnly,
    },
  }
}

export const mapCalendarEventRowToDisplay = (event: CalendarEventRow): CalendarEventDisplay => ({
  id: event.id,
  title: event.title ?? '(No title)',
  start_at: event.start_at,
  end_at: event.end_at,
  all_day: event.all_day,
  description: event.description ?? undefined,
  location: event.location ?? undefined,
  creator_email: event.creator_email ?? undefined,
  html_link: event.html_link ?? undefined,
  sourceAccountId: event.is_internal ? `internal_${event.user_id}` : event.google_account_id ?? undefined,
  source: event.is_internal ? 'internal' : 'google',
})
