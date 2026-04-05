<script lang="ts" setup>
import { watch } from 'vue'

// stores
import { useCalendarStore, ACCOUNT_COLORS, INTERNAL_CALENDAR_COLOR } from '@entities/calendar/stores/calendar'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar/stores/google-calendar'
import { useUserStore } from '@features/auth/stores/user'
import { useSettingsStore } from '@features/settings'

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
import { createCurrentTimePlugin } from '@schedule-x/current-time'
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
const settingsStore = useSettingsStore()

const {
  selectedEvent,
  isEventModalOpen,
  isEventFormModalOpen,
  eventFormMode,
  eventFormPrefill,
  events,
} = storeToRefs(calendarStore)

const { loadViewEvents } = useCalendar()
const { updateEvent } = useInternalEvents()

// Drag-to-create state
let dragStartDateTime: Temporal.ZonedDateTime | null = null

const buildCalendarsConfig = () => {
  const accounts = googleCalendarStore.accounts
  const prefs = settingsStore.preferences
  const config: Record<string, any> = {}

  const userId = userStore.user?.id
  if (userId) {
    config[`internal_${userId}`] = prefs?.eventsColors['internal'] ?? INTERNAL_CALENDAR_COLOR
  }

  accounts.forEach((account, index) => {
    config[account.id] = prefs?.eventsColors[account.id] ?? ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
  })

  return config
}

// Do not use a ref — the calendar instance is stateful and not meant to be reactive.
// v3: plugins are the second argument, not a config property.
const calendarApp = createCalendar({
  selectedDate: Temporal.PlainDate.from(Temporal.Now.plainDateISO().toString()),
  calendars: buildCalendarsConfig(),
  timezone: Temporal.Now.timeZoneId(),
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
    onMouseDownDateTime(dateTime) {
      dragStartDateTime = dateTime
    },
    onClickDateTime(dateTime) {
      // If drag produced a range, use it; otherwise default to 1-hour event
      let start: Date
      let end: Date

      if (dragStartDateTime && !dragStartDateTime.equals(dateTime)) {
        // Ensure start < end regardless of drag direction
        const a = dragStartDateTime.toInstant().epochMilliseconds
        const b = dateTime.toInstant().epochMilliseconds
        start = new Date(Math.min(a, b))
        end = new Date(Math.max(a, b))
      } else {
        start = new Date(dateTime.toInstant().epochMilliseconds)
        end = new Date(dateTime.add({ hours: 1 }).toInstant().epochMilliseconds)
      }

      dragStartDateTime = null
      calendarStore.openCreateModal({ date: { start, end }, all_day: false })
    },
    onClickDate(date) {
      const d = new Date(date.toString())
      calendarStore.openCreateModal({ date: { start: d, end: d }, all_day: true })
    },
    onBeforeEventUpdate(oldEvent) {
      // Only allow drag/resize on internal events
      const storeEvent = events.value.find((e) => e.id === String(oldEvent.id))
      return storeEvent?.source === 'internal'
    },
    async onEventUpdate(updatedEvent) {
      const storeEvent = events.value.find((e) => e.id === String(updatedEvent.id))
      if (!storeEvent || storeEvent.source !== 'internal') return

      const toMs = (v: unknown): number => {
        if (typeof v === 'string') return new Date(v.replace(/\[.*\]$/, '')).getTime()
        if (v && typeof v === 'object' && 'epochMilliseconds' in v) return (v as any).epochMilliseconds
        return new Date(String(v)).getTime()
      }

      const newStartMs = toMs(updatedEvent.start)
      const newEndMs = toMs(updatedEvent.end)
      const oldStartMs = new Date(storeEvent.start_at.replace(/\[.*\]$/, '')).getTime()
      const oldEndMs = new Date(storeEvent.end_at.replace(/\[.*\]$/, '')).getTime()

      if (newStartMs === oldStartMs && newEndMs === oldEndMs) return

      const result = await updateEvent(storeEvent.id, {
        start_at: new Date(newStartMs).toISOString(),
        end_at: new Date(newEndMs).toISOString(),
      })

      // Update the store event in-place instead of refetching everything
      if (result) {
        const idx = events.value.findIndex((e) => e.id === storeEvent.id)
        if (idx !== -1) {
          events.value[idx] = { ...events.value[idx], start_at: result.start_at, end_at: result.end_at }
        }
      }
    },
  },
}, [createDragAndDropPlugin(), createResizePlugin(), createCurrentTimePlugin()])

// Reactively push events from the store into ScheduleX
watch(events, (storeEvents) => {
  calendarApp.events.set(storeEvents.map(mapToScheduleXEvent))
}, { immediate: true })

// Reactively update calendar colors when settings preferences change
watch(
  () => settingsStore.preferences,
  () => {
    const newConfig = buildCalendarsConfig()
    const internalApp = (calendarApp as any).$app
    if (internalApp?.calendarState?.calendars) {
      internalApp.calendarState.calendars.value = newConfig
    }
  }
)

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
