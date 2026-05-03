<script lang="ts" setup>
import { ScheduleXCalendar } from '@schedule-x/vue'
import { useCalendarApp } from '@entities/calendar'
import CalendarSearch from '@entities/calendar/components/CalendarSearch.vue'
import type { CalendarEventDisplay } from '@entities/calendar'

definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})

const { calendarApp, goToDate, openEventView } = useCalendarApp()

const handleSearchSelect = (event: CalendarEventDisplay) => {
  goToDate(event.start_at)
  openEventView(event)
}
</script>

<template>
  <div class="flex flex-col flex-1 overflow-hidden">
    <div class="px-4 py-3 border-b border-border">
      <CalendarSearch @select="handleSearchSelect" />
    </div>
    <div class="flex-1 overflow-auto">
      <ScheduleXCalendar :calendar-app="calendarApp" />
    </div>
  </div>
</template>

<style scoped>
:deep(.sx__calendar) {
  border: 0 !important;
}

:deep(.sx__time-grid-event.is-event-copy),
:deep(.sx__date-grid-event.sx__date-grid-event--copy) {
  opacity: 0.92;
  z-index: 20 !important;
  pointer-events: none;
}

:deep(.sx__time-grid-event:not(.is-event-copy):has(+ .is-event-copy)),
:deep(.sx__date-grid-event:not(.sx__date-grid-event--copy):has(+ .sx__date-grid-event--copy)) {
  opacity: 0.2;
}
</style>
