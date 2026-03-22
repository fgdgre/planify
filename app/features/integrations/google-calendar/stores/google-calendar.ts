// types
import type { CalendarEvent, UserCalendarEvents } from "../types/google-calendar";
import type { GoogleAccount } from '@shared/types/google'

export const useGoogleCalendarStore = defineStore('google-calendar', () => {
  // state
  const accounts = ref<GoogleAccount[]>([])
  const calendarEvents = ref<UserCalendarEvents>({})
  const loading = ref<boolean>(false)

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

  return {
    getAccounts,
    getCalendarEvents,
    getAllEvents,
    isLoading,
    setLoading,
    setAccounts,
    setCalendarEvents,
  }
})
