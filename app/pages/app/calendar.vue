<script lang="ts" setup>
import { ScheduleXCalendar } from '@schedule-x/vue'
import { useCalendarApp } from '@entities/calendar'
import CalendarSearch from '@entities/calendar/components/CalendarSearch.vue'
import type { CalendarEventDisplay } from '@entities/calendar'
import { useTourTarget } from '@shared/api/demo'

definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})

const { calendarApp, goToDate, openEventView, refreshEvents, isRefreshing } = useCalendarApp()

const gridRef = useTemplateRef('gridRef')
useTourTarget('calendarGrid', gridRef)

const handleSearchSelect = (event: CalendarEventDisplay) => {
  goToDate(event.start_at)
  openEventView(event)
}
</script>

<template>
  <Teleport to="#page-header-actions" defer>
    <CalendarSearch @select="handleSearchSelect" />
    <SupaButton
      icon="heroicons:arrow-path"
      variant="transparent"
      :loading="isRefreshing"
      :disabled="isRefreshing"
      :ui="{ icon: isRefreshing ? 'animate-spin' : '' }"
      @click="refreshEvents"
    />
  </Teleport>

  <div ref="gridRef" class="flex-1 min-h-0 overflow-hidden">
    <ScheduleXCalendar :calendar-app="calendarApp" />
  </div>
</template>

<style scoped>
:deep(.sx__calendar) {
  border: 0 !important;
}

/* Give Schedule-X a bounded height so its own view container scrolls the grid
   and the calendar header and week header stay in view. */
:deep(.sx-vue-calendar-wrapper) {
  height: 100%;
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

:deep(.sx__event.is-search-dim) {
  opacity: 0.3;
  filter: grayscale(1);
}

:deep(.sx__event.is-search-match) {
  box-shadow: 0 0 0 2px var(--color-primary, #2563eb);
  z-index: 10;
}
</style>
