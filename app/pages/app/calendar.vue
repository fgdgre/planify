<script lang="ts" setup>
import { watch } from 'vue'

// stores
import { useCalendarStore, ACCOUNT_COLORS } from '@entities/calendar/stores/calendar'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar/stores/google-calendar'

// composables
import { useCalendar } from '@entities/calendar'

// calendar
import { mapToScheduleXEvent } from '@entities/calendar/helpers'
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
import EventDetailsModal from "@entities/calendar/components/EventDetailsModal.vue";

definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})

const googleCalendarStore = useGoogleCalendarStore()
const calendarStore = useCalendarStore()
const { selectedEvent, isEventModalOpen, events } = storeToRefs(calendarStore)
const { loadViewEvents } = useCalendar()

const buildCalendarsConfig = () => {
  const accounts = googleCalendarStore.accounts
  return Object.fromEntries(
    accounts.map((account, index) => [
      account.id,
      ACCOUNT_COLORS[index % ACCOUNT_COLORS.length],
    ])
  )
}

const calendarApp = createCalendar({
  selectedDate: Temporal.PlainDate.from(Temporal.Now.plainDateISO().toString()),
  calendars: buildCalendarsConfig(),
  views: [
    createViewDay(),
    createViewWeek(),
    createViewMonthGrid(),
    createViewMonthAgenda(),
  ],
  events: [],
  callbacks: {
    onRangeUpdate(range) {
      loadViewEvents(range)
    },
    onEventClick(event) {
      const storeEvent = events.value.find((e) => e.id === String(event.id))
      if (storeEvent) {
        calendarStore.setSelectedEvent(storeEvent)
        calendarStore.setEventModalOpen(true)
      }
    },
  },
})

// Reactively push events from the store into ScheduleX
watch(events, (storeEvents) => {
  calendarApp.events.set(storeEvents.map(mapToScheduleXEvent))
}, { immediate: true })

onMounted(() => {
  const range = calendarApp.$app?.calendarState.range.value
  if (range) {
    loadViewEvents(range)
  }
})
</script>

<template>
  <div class="flex-1 overflow-auto">
    <ScheduleXCalendar :calendar-app="calendarApp" />


    <EventDetailsModal
      v-if="isEventModalOpen"
      :selected-event="selectedEvent"
      @close="calendarStore.setEventModalOpen(false)"
    />
  </div>
</template>
