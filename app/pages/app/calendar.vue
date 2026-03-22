<script lang="ts" setup>
import { watch } from 'vue'

// types
import type { CalendarEventExternal } from '@schedule-x/calendar'
import type { CalendarEvent } from '@features/integrations/google-calendar'

// stores
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";

// components
import { ScheduleXCalendar } from '@schedule-x/vue'

import {
  createCalendar,
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from '@schedule-x/calendar'
import '@schedule-x/theme-default/dist/index.css'
import 'temporal-polyfill/global'

definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})

const googleCalendarStore = useGoogleCalendarStore()
const { getAllEvents } = storeToRefs(googleCalendarStore)

const parseTemporalStart = (dateString: string, allDay: boolean) => {
  if (allDay) {
    return Temporal.PlainDate.from(dateString.slice(0, 10))
  }

  // Google returns ISO strings like "2024-03-22T10:00:00+02:00"
  // Convert via Instant to avoid offset/timezone annotation conflicts
  const instant = Temporal.Instant.from(dateString)
  return instant.toZonedDateTimeISO('UTC')
}

const mapToScheduleXEvent = (event: CalendarEvent): CalendarEventExternal => {
  return {
    id: event.id,
    start: parseTemporalStart(event.start_at, event.all_day),
    end: parseTemporalStart(event.end_at, event.all_day),
    title: event.title ?? '(No title)',
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    calendarId: event.calendar_id,
  }
}

// Do not use a ref here, as the calendar instance is not reactive, and doing so might cause issues
// For updating events, use the events facade
const calendarApp = createCalendar({
  selectedDate: Temporal.PlainDate.from(Temporal.Now.plainDateISO().toString()),
  views: [
    createViewDay(),
    createViewWeek(),
    createViewMonthGrid(),
    createViewMonthAgenda(),
  ],
  events: [],
})

watch(getAllEvents, (events) => {
  console.log('events', events)
  const mapped = events.map(mapToScheduleXEvent)
  calendarApp.events.set(mapped)
}, { immediate: true })
</script>

<template>
  <div class="flex-1 overflow-auto">
    <ScheduleXCalendar :calendar-app="calendarApp" />
  </div>
</template>
