<script lang="ts" setup>
import { ScheduleXCalendar } from '@schedule-x/vue'
import { useCalendarApp } from '@entities/calendar'

definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})

const { calendarApp } = useCalendarApp()
</script>

<template>
  <div class="flex-1 overflow-auto">
    <ScheduleXCalendar :calendar-app="calendarApp" />
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
