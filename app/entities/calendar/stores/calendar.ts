import type { CalendarEventDisplay, ViewDateRange, EventFormMode, EventFormData } from '../types'

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

export const INTERNAL_CALENDAR_COLOR = {
  colorName: 'gray',
  lightColors: {
    main: 'rgb(120, 120, 120)',
    container: 'rgba(120, 120, 120, 0.2)',
    onContainer: 'rgb(120, 120, 120)',
  },
}

export const useCalendarStore = defineStore('calendar', () => {
  // state
  const events = ref<CalendarEventDisplay[]>([])
  const viewRange = ref<ViewDateRange | null>(null)
  const selectedEvent = ref<CalendarEventDisplay | null>(null)
  const isEventModalOpen = ref(false)

  // event form modal state
  const isEventFormModalOpen = ref(false)
  const eventFormMode = ref<EventFormMode>('create')
  const eventFormPrefill = ref<Partial<EventFormData> | null>(null)

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

  const openCreateModal = (prefill?: Partial<EventFormData>) => {
    eventFormPrefill.value = prefill ?? null
    eventFormMode.value = 'create'
    isEventFormModalOpen.value = true
  }

  const openEditModal = (event: CalendarEventDisplay) => {
    selectedEvent.value = event
    eventFormMode.value = 'edit'
    isEventFormModalOpen.value = true
  }

  const closeFormModal = () => {
    isEventFormModalOpen.value = false
    eventFormPrefill.value = null
  }

  return {
    events,
    viewRange,
    selectedEvent,
    isEventModalOpen,
    isEventFormModalOpen,
    eventFormMode,
    eventFormPrefill,
    setEvents,
    setViewRange,
    setSelectedEvent,
    setEventModalOpen,
    openCreateModal,
    openEditModal,
    closeFormModal,
  }
})
