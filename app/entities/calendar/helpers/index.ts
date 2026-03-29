import type { CalendarEventDisplay } from '../types'
import type { CalendarEventExternal } from '@schedule-x/calendar'

export const parseTemporalStart = (dateString: string, allDay: boolean) => {
  if (allDay) {
    return Temporal.PlainDate.from(dateString.slice(0, 10))
  }

  const instant = Temporal.Instant.from(dateString)
  return instant.toZonedDateTimeISO('UTC')
}

export const mapToScheduleXEvent = (event: CalendarEventDisplay): CalendarEventExternal => {
  return {
    id: event.id,
    start: parseTemporalStart(event.start_at, event.all_day),
    end: parseTemporalStart(event.end_at, event.all_day),
    title: event.title,
    description: event.description,
    location: event.location,
    calendarId: event.sourceAccountId,
  }
}
