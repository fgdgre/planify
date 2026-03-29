import { useGoogleCalendarStore } from "@features/integrations/google-calendar";
import { useCalendar } from "@entities/calendar/composables/calendar";
import { mapToScheduleXEvent } from "@entities/calendar/helpers";
import {
  createCalendar,
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek
} from "@schedule-x/calendar";
import type { CalendarEvent, WeekOptions } from "@schedule-x/calendar";
import type { ViewDateRange } from "@features/integrations/google-calendar/stores/google-calendar";

export const useCalendarStore = defineStore('calendar', () => {
  // setup
  const googleCalendarStore = useGoogleCalendarStore()
  const { allEvents, accounts } = storeToRefs(googleCalendarStore)

  const { loadViewEvents } = useCalendar()

  // state
  const accountEventsColor = ref([
    {
      colorName: 'red',
      lightColors: {
        main: 'rgb(255, 0, 0)',
        container: 'rgba(255, 0, 0, 0.2)',
        onContainer: 'rgb(255, 0, 0)',
      },
    },
    {
      colorName: 'green',
      lightColors: {
        main: 'rgb(0, 180, 0)',
        container: 'rgba(0, 180, 0, 0.2)',
        onContainer: 'rgb(0, 180, 0)',
      },
    },
    {
      colorName: 'blue',
      lightColors: {
        main: 'rgb(0, 110, 255)',
        container: 'rgba(0, 110, 255, 0.2)',
        onContainer: 'rgb(0, 110, 255)',
      },
    },
  ])

  const viewRange = ref<ViewDateRange | null>(null)
  const selectedEvent = ref<CalendarEvent | null>(null)
  const isEventModalOpen = ref(false)

  // FIXME: types

  const events = ref<CalendarEvent[]>([])

  const calendars = ref<any>(null)

  const selectedDate = ref(Temporal.PlainDate.from(Temporal.Now.plainDateISO().toString()))

  const weekOptions = ref<WeekOptions>({
    eventWidth: 95,
  })


  // getters
  const calendarConfig = computed(() => createCalendar({
    calendars: Object.fromEntries(
        accounts.value?.map((account, index) => [
          account.id,
          accountEventsColor.value[index % accountEventsColor.value.length],
        ])
      ),
    events: events.value,
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    selectedDate: selectedDate.value,
    weekOptions: weekOptions.value,
    callbacks: {
      async fetchEvents(range) {
        await loadViewEvents(range)

        return allEvents.value?.map(mapToScheduleXEvent)
      },
      onClickPlusEvents(some) {
        console.log('Clicked plus events', some)
      },
      onDoubleClickEvent(event) {
        console.log('Double clicked event', event)
      },
      onEventClick(event) {
        selectedEvent.value = event
        isEventModalOpen.value = true
      },
      onSelectedDateUpdate(event) {
        console.log('onSelectedDateUpdate', event)
      },
      onEventUpdate(updatedEvent) {
        console.log('onEventUpdate', updatedEvent)
      },
    },
  }))

  // actions
  const setViewRange = (range: ViewDateRange) => {
    viewRange.value = range
  }
  const setSelectedEvent = (event: CalendarEvent | null) => {
    selectedEvent.value = event
  }
  const selEventModal = (event: boolean) => {
    isEventModalOpen.value = event
  }
  const setAccountEventsColor = (settings: any) => {
    accountEventsColor.value = settings
  }

  return {
    calendarConfig,
    viewRange,
    selectedEvent,
    isEventModalOpen,
    events,
    calendars,
    selectedDate,
    weekOptions,
    accountEventsColor,
    setViewRange,
    setSelectedEvent,
    selEventModal,
    setAccountEventsColor
  }
})
