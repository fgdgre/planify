// types
import type { CalendarEvent, UserCalendarEvents } from "../types/google-calendar";
import type { GoogleAccount } from '@shared/types/google'

export interface ViewDateRange {
  start: string // ISO string
  end: string   // ISO string
}

export const useGoogleCalendarStore = defineStore('google-calendar', () => {
  // state
  const accounts = ref<GoogleAccount[]>([])
  const calendarEvents = ref<UserCalendarEvents>({})
  const loading = ref<boolean>(false)
  const viewRange = ref<ViewDateRange | null>(null)
  const selectedEvent = ref<CalendarEvent | null>(null)
  const isEventModalOpen = ref(false)

  // getters
  const getAccounts = computed(() => accounts.value)
  const getCalendarEvents = computed(() => calendarEvents.value)
  const isLoading = computed(() => loading.value)

  const getAllEvents = computed(() => {
    return Object.values(calendarEvents.value).flat()
  })

  // setters
  const setAccounts = (value: GoogleAccount[]) => {
    accounts.value = value
  }
  const setCalendarEvents = (googleAccountId: string, value: CalendarEvent[]) => {
    calendarEvents.value[googleAccountId] = value
  }
  const setLoading = (value: boolean) => {
    loading.value = value
  }
  const setViewRange = (range: ViewDateRange) => {
    viewRange.value = range
  }
  const setEventModal = (state: boolean) => {
    isEventModalOpen.value = state
  }
  const setSelectedEvent = (event: CalendarEvent) => {
    selectedEvent.value = event
  }

  return {
    getAccounts,
    getCalendarEvents,
    getAllEvents,
    isLoading,
    viewRange,
    selectedEvent,
    isEventModalOpen,
    setLoading,
    setAccounts,
    setCalendarEvents,
    setViewRange,
    setEventModal,
    setSelectedEvent,
  }
})
