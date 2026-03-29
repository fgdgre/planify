// types
import type { CalendarEvent, UserCalendarEvents } from "../types/google-calendar";
import type { GoogleAccount } from '@shared/types/google'

export const useGoogleCalendarStore = defineStore('google-calendar', () => {
  // state
  const accounts = ref<GoogleAccount[]>([])
  const calendarEvents = ref<UserCalendarEvents>({})
  const loading = ref<boolean>(false)

  // getters
  const isLoading = computed(() => loading.value)

  const allEvents = computed(() => {
    return Object.values(calendarEvents.value).flat()
  })

  // actions
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
    allEvents,
    isLoading,
    setLoading,
    setAccounts,
    setCalendarEvents,
  }
})
