import { watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
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

import { useCalendarStore, ACCOUNT_COLORS, INTERNAL_CALENDAR_COLOR } from '../stores/calendar'
import { useCalendar } from './calendar'
import { useCalendarFilters } from './calendar-filters'
import { useInternalEvents } from './useInternalEvents'
import { mapToScheduleXEvent } from '../helpers'
import { scrollToWorkingHoursWhenRendered } from '../helpers/scroll'
import { findEventElement, findSlotPoint } from '../helpers/tour-geometry'
import { showWeekView } from '../helpers/view'
import { calendarControls, registerControls } from './tour-controls'
import { useGoogleCalendarStore, useGoogleCalendar } from '@features/integrations/google-calendar'
import { useUserStore } from '@features/auth/stores/user'
import { useSettingsStore } from '@features/settings'
import type { CalendarEventDisplay } from '../types'
import { useCalendarFiltersStore } from '../stores/calendar-filters'

const toMs = (v: unknown): number => {
  if (typeof v === 'string') return new Date(v.replace(/\[.*\]$/, '')).getTime()
  if (v && typeof v === 'object' && 'epochMilliseconds' in v) return (v as { epochMilliseconds: number }).epochMilliseconds
  return new Date(String(v)).getTime()
}

const isoToYmd = (iso: string): string => {
  const d = new Date(iso.replace(/\[.*\]$/, ''))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const useCalendarApp = () => {
  const googleCalendarStore = useGoogleCalendarStore()
  const calendarStore = useCalendarStore()
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()
  const filtersStore = useCalendarFiltersStore()
  const route = useRoute()
  const router = useRouter()

  const { events } = storeToRefs(calendarStore)
  const { loadViewEvents } = useCalendar()
  const { updateEvent } = useInternalEvents()
  const { isSearching, visibleEvents, matchesSearch } = useCalendarFilters()
  const { syncAllAccounts } = useGoogleCalendar()

  const isRefreshing = ref(false)

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

  // Opens the time grid on working hours. Called only on first render and when
  // the view/date changes, so the user's own scrolling is left alone.
  const calendarRoot = (): HTMLElement | undefined => (calendarApp as any).$app?.elements.calendarWrapper

  const scrollToWorkingHours = () => scrollToWorkingHoursWhenRendered(calendarRoot)

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

  const calendarApp = createCalendar({
    selectedDate: Temporal.PlainDate.from(Temporal.Now.plainDateISO().toString()),
    calendars: buildCalendarsConfig(),
    // Full day on purpose: events outside business hours must stay reachable.
    // The grid is scrolled to working hours instead (see scrollToWorkingHours).
    dayBoundaries: { start: '00:00', end: '24:00' },
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
      onRender() {
        scrollToWorkingHours()
      },
      onRangeUpdate(range) {
        loadViewEvents(range)
        scrollToWorkingHours()
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

  // While searching, matches get a ring and everything else is dimmed (see the calendar page styles).
  const searchClassesOf = (event: CalendarEventDisplay) => {
    if (!isSearching.value) return []
    return [matchesSearch(event) ? 'is-search-match' : 'is-search-dim']
  }

  watch([visibleEvents, isSearching, () => filtersStore.searchQuery, () => googleCalendarStore.accounts], () => {
    calendarApp.events.set(visibleEvents.value.map((e) => mapToScheduleXEvent(e, searchClassesOf(e))))
  }, { immediate: true })

  watch(
    () => settingsStore.preferences,
    () => {
      const newConfig = buildCalendarsConfig()
      const internalApp = (calendarApp as any).$app
      if (internalApp?.calendarState?.calendars) {
        internalApp.calendarState.calendars.value = newConfig
      }
    },
  )

  const currentRange = () => (calendarApp as any).$app?.calendarState.range.value

  onMounted(() => {
    const range = currentRange()
    if (range) {
      loadViewEvents(range)
    }
  })

  // A background sync (middleware, settings) bumps syncVersion when Google had
  // new data; reload the visible range so the grid updates in place.
  watch(
    () => googleCalendarStore.syncVersion,
    () => {
      if (isRefreshing.value) return
      const range = currentRange()
      if (range) loadViewEvents(range)
    },
  )

  const goToDate = (iso: string) => {
    const ymd = isoToYmd(iso)
    const ctrl = (calendarApp as any).setDate ?? (calendarApp as any).calendarControls?.setDate
    if (typeof ctrl === 'function') {
      ctrl.call(calendarApp, ymd)
    }
  }

  // Manual refresh: force a Google sync for every connected account, then
  // re-run the current view's range query so the calendar updates in place.
  const refreshEvents = async () => {
    if (isRefreshing.value) return
    isRefreshing.value = true
    try {
      await syncAllAccounts({ force: true })

      const range = currentRange()
      if (range) await loadViewEvents(range)
    } finally {
      isRefreshing.value = false
    }
  }

  registerControls(calendarControls, {
    showCurrentWeek: () => showWeekView(calendarApp, Temporal.Now.plainDateISO()),
    slotPoint: (date) => findSlotPoint(calendarRoot(), date),
    eventElement: (id) => findEventElement(calendarRoot(), id),
  })

  return { calendarApp, goToDate, openEventView, refreshEvents, isRefreshing }
}
