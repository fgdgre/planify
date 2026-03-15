import type { GoogleCalendarEvent, UserCalendarEvents } from "../types/google-calendar";
import type { GoogleAccount } from '@shared/types/google'

export const useGoogleCalendarStore = defineStore('google-calendar', () => {
  // state
  const accounts = ref<GoogleAccount[]>([])
  const calendarEvents = ref<UserCalendarEvents | null>({})
  const loading = ref<boolean>(false)

  // getters
  const getAccounts = computed(() => accounts.value)
  const getCalendarEvents = computed(() => calendarEvents.value)
  const isLoading = computed(() => loading.value)

  // setters
  const setAccounts = (value: GoogleAccount[]) => {
    accounts.value = value
  }
  const setCalendarEvents = (googleAccountId: string, value: GoogleCalendarEvent[]) => {
    if (!calendarEvents.value) calendarEvents.value = {};
    if (!calendarEvents.value[googleAccountId]) calendarEvents.value[googleAccountId] = [];

    calendarEvents.value[googleAccountId] = value;
  };
  const setLoading = (value: boolean) => {
      loading.value = value
  }

  return {
    getAccounts,
    getCalendarEvents,
    isLoading,
    setLoading,
    setAccounts,
    setCalendarEvents,
  }
})
