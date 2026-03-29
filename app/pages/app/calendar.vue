<script lang="ts" setup>
import { watch } from 'vue'

// stores
import { useCalendarStore, ACCOUNT_COLORS, INTERNAL_CALENDAR_COLOR } from '@entities/calendar/stores/calendar'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar/stores/google-calendar'
import { useUserStore } from '@features/auth/stores/user'

// composables
import { useCalendar } from '@entities/calendar'
import { useInternalEvents } from '@entities/calendar/composables/useInternalEvents'

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
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop'
import { createResizePlugin } from '@schedule-x/resize'
import '@schedule-x/theme-default/dist/index.css'
import 'temporal-polyfill/global'

// components
import EventDetailsModal from '@entities/calendar/components/EventDetailsModal.vue'
import EventFormModal from '@entities/calendar/components/EventFormModal.vue'

definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})

const googleCalendarStore = useGoogleCalendarStore()
const calendarStore = useCalendarStore()
const userStore = useUserStore()

const {
  selectedEvent,
  isEventModalOpen,
  isEventFormModalOpen,
  eventFormMode,
  eventFormPrefill,
  events,
} = storeToRefs(calendarStore)

const { loadViewEvents, fetchEvents } = useCalendar()
const { updateEvent } = useInternalEvents()

const buildCalendarsConfig = () => {
  const accounts = googleCalendarStore.accounts
  const config: Record<string, any> = {}

  // Internal events calendar (keyed with internal_ prefix to match sourceAccountId)
  const userId = userStore.user?.id
  if (userId) {
    config[`internal_${userId}`] = INTERNAL_CALENDAR_COLOR
  }

  // Google account calendars
  accounts.forEach((account, index) => {
    config[account.id] = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
  })

  return config
}

// Do not use a ref — the calendar instance is stateful and not meant to be reactive.
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
  plugins: [createDragAndDropPlugin(), createResizePlugin()],
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
    onClickDateTime(dateTime) {
      const start = dateTime.toInstant().toString()
      const end = dateTime.add({ hours: 1 }).toInstant().toString()
      calendarStore.openCreateModal({ start_at: start, end_at: end, all_day: false })
    },
    onClickDate(date) {
      const iso = date.toString()
      calendarStore.openCreateModal({ start_at: iso, end_at: iso, all_day: true })
    },
    onBeforeEventUpdate(oldEvent) {
      // Only allow drag/resize on internal events
      const storeEvent = events.value.find((e) => e.id === String(oldEvent.id))
      return storeEvent?.source === 'internal'
    },
    async onEventUpdate(updatedEvent) {
      const storeEvent = events.value.find((e) => e.id === String(updatedEvent.id))
      if (!storeEvent || storeEvent.source !== 'internal') return

      // Convert ScheduleX Temporal values back to ISO strings
      const startStr = typeof updatedEvent.start === 'string'
        ? updatedEvent.start
        : updatedEvent.start.toString().replace(/\[.*\]$/, '')
      const endStr = typeof updatedEvent.end === 'string'
        ? updatedEvent.end
        : updatedEvent.end.toString().replace(/\[.*\]$/, '')

      await updateEvent(storeEvent.id, {
        start_at: new Date(startStr).toISOString(),
        end_at: new Date(endStr).toISOString(),
      })
      await fetchEvents()
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

    <EventFormModal
      v-if="isEventFormModalOpen"
      :mode="eventFormMode"
      :prefill="eventFormPrefill"
      :event="selectedEvent"
      @close="calendarStore.closeFormModal()"
    />
  </div>
</template>
