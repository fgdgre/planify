import type { CalendarEventDisplay } from '../types'
import type { CalendarEventExternal } from '@schedule-x/calendar'

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
