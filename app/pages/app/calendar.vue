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

definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})

const calendarStore = useCalendarStore()
const googleCalendarStore = useGoogleCalendarStore()
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
      calendarStore.setSelectedEvent({
        id: String(event.id),
        title: event.title ?? '(No title)',
        start_at: String(event.start),
        end_at: String(event.end),
        all_day: false,
        description: event.description,
        location: event.location,
        creator_email: (event as any).creator_email,
        sourceAccountId: event.calendarId,
      })
      calendarStore.setEventModalOpen(true)
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

    <SupaModal
      v-if="isEventModalOpen"
      @close="calendarStore.setEventModalOpen(false)"
      scrollable-content
      show-close-button
      :title="selectedEvent?.title || 'Event details'"
    >
      <template #default>
        <p>{{ selectedEvent?.creator_email }} - {{ selectedEvent?.end_at }}</p>
        <p>{{ selectedEvent?.location }}</p>
        <p>{{ selectedEvent?.description }}</p>
      </template>
    </SupaModal>
  </div>
</template>
