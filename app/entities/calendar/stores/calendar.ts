import type { CalendarEventDisplay, ViewDateRange } from '../types'

export const ACCOUNT_COLORS = [
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
]

export const useCalendarStore = defineStore('calendar', () => {
  // state
  const events = ref<CalendarEventDisplay[]>([])
  const viewRange = ref<ViewDateRange | null>(null)
  const selectedEvent = ref<CalendarEventDisplay | null>(null)
  const isEventModalOpen = ref(false)

  // actions
  const setEvents = (value: CalendarEventDisplay[]) => {
    events.value = value
  }
  const setViewRange = (range: ViewDateRange) => {
    viewRange.value = range
  }
  const setSelectedEvent = (event: CalendarEventDisplay | null) => {
    selectedEvent.value = event
  }
  const setEventModalOpen = (state: boolean) => {
    isEventModalOpen.value = state
  }

  return {
    events,
    viewRange,
    selectedEvent,
    isEventModalOpen,
    setEvents,
    setViewRange,
    setSelectedEvent,
    setEventModalOpen,
  }
})
