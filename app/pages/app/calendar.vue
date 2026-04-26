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

definePageMeta({
  layout: 'app',
  title: 'Calendar',
  middleware: ['google-calendar-events'],
})

const googleCalendarStore = useGoogleCalendarStore()
const calendarStore = useCalendarStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const route = useRoute()
const router = useRouter()

const { events } = storeToRefs(calendarStore)

const { loadViewEvents } = useCalendar()
const { updateEvent } = useInternalEvents()

let dragStartDateTime: Temporal.ZonedDateTime | null = null

const replaceCalendarQuery = async (updates: Record<string, string | null | undefined>) => {
  const query = { ...route.query }

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      delete query[key]
      return
    }

    query[key] = value
  })

  await router.replace({ query })
}

const openEventView = (event: { id: string }) => replaceCalendarQuery({
  eventId: event.id,
  action: null,
  eventStart: null,
  eventEnd: null,
  eventAllDay: null,
})

const openEventCreate = (prefill: { date: { start: Date; end: Date }; all_day: boolean }) => replaceCalendarQuery({
  eventId: null,
  action: 'create',
  eventStart: prefill.date.start.toISOString(),
  eventEnd: prefill.date.end.toISOString(),
  eventAllDay: String(prefill.all_day),
})

const buildCalendarsConfig = () => {
  const accounts = googleCalendarStore.accounts
  const prefs = settingsStore.preferences
  const config: Record<string, any> = {
    dayBoundaries: {
      start: '06:00',
      end: '18:00',
    },
    weekOptions: {
      eventWidth: 95,
    }
  }

  const userId = userStore.user?.id
  if (userId) {
    config[`internal_${userId}`] = prefs?.eventsColors['internal'] ?? INTERNAL_CALENDAR_COLOR
  }

  accounts.forEach((account, index) => {
    config[account.id] = prefs?.eventsColors[account.id] ?? ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
  })

  return config
}

const calendarApp = createCalendar({
  selectedDate: Temporal.PlainDate.from(Temporal.Now.plainDateISO().toString()),
  calendars: buildCalendarsConfig(),
  weekOptions: {
    eventWidth: 95,
  },
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
        openEventView(storeEvent)
      }
    },
    onMouseDownDateTime(dateTime) {
      dragStartDateTime = dateTime
    },
    onClickDateTime(dateTime) {
      let start: Date
      let end: Date

      if (dragStartDateTime && !dragStartDateTime.equals(dateTime)) {
        const a = dragStartDateTime.toInstant().epochMilliseconds
        const b = dateTime.toInstant().epochMilliseconds
        start = new Date(Math.min(a, b))
        end = new Date(Math.max(a, b))
      } else {
        start = new Date(dateTime.toInstant().epochMilliseconds)
        end = new Date(dateTime.add({ hours: 1 }).toInstant().epochMilliseconds)
      }

      dragStartDateTime = null
      openEventCreate({ date: { start, end }, all_day: false })
    },
    onClickDate(date) {
      const d = new Date(date.toString())
      openEventCreate({ date: { start: d, end: d }, all_day: true })
    },
    onBeforeEventUpdate(oldEvent) {
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
      }) as { start_at: string; end_at: string } | null

      if (result) {
        const idx = events.value.findIndex((e) => e.id === storeEvent.id)
        const currentEvent = events.value[idx]
        if (currentEvent) {
          events.value[idx] = { ...currentEvent, start_at: result.start_at, end_at: result.end_at }
        }
      }
    },
  },
}, [createDragAndDropPlugin(), createResizePlugin(), createCurrentTimePlugin()])

watch(events, (storeEvents) => {
  calendarApp.events.set(storeEvents.map(mapToScheduleXEvent))
}, { immediate: true })

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
  const range = (calendarApp as any).$app?.calendarState.range.value
  if (range) {
    loadViewEvents(range)
  }
})
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
