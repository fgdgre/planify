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


  // getters
  const getCalendarEvents = computed(() => calendarEvents.value)
  const isLoading = computed(() => loading.value)

  const allEvents = computed(() => {
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

  return {
    accounts,
    calendarEvents,
    loading,
    getCalendarEvents,
    allEvents,
    isLoading,
    setLoading,
    setAccounts,
    setCalendarEvents,
  }
})
