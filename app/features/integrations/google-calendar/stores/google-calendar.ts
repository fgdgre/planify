// types
import type { CalendarEvent, UserCalendarEvents } from "../types/google-calendar";
import type { GoogleAccount } from '@shared/types/google'

export const useGoogleCalendarStore = defineStore('google-calendar', () => {
  // state
  const accounts = ref<GoogleAccount[]>([])
  /** True once `google_accounts` has been read this session; later reads are skipped unless forced. */
  const accountsLoaded = ref(false)
  const calendarEvents = ref<UserCalendarEvents>({})
  const loading = ref<boolean>(false)
  /** Per account id: when `google-sync-events` last completed (ms epoch). Drives the sync TTL. */
  const syncedAt = ref<Record<string, number>>({})
  /** Per account id: whether `google-list-calendars` has run this session. */
  const calendarsListed = ref<Record<string, boolean>>({})
  /** Incremented after a sync brought new data so open views can reload their range. */
  const syncVersion = ref(0)

  // getters
  const isLoading = computed(() => loading.value)

  const allEvents = computed<CalendarEvent[]>(() => {
    return Object.values(calendarEvents.value).flat()
  })

  // actions
  const setAccounts = (value: GoogleAccount[]) => {
    accounts.value = value
    accountsLoaded.value = true
  }
  const replaceCalendarEvents = (value: UserCalendarEvents) => {
    calendarEvents.value = value
  }
  const setLoading = (value: boolean) => {
    loading.value = value
  }
  const markSynced = (googleAccountId: string, at: number) => {
    syncedAt.value = { ...syncedAt.value, [googleAccountId]: at }
  }
  const markCalendarsListed = (googleAccountId: string) => {
    calendarsListed.value = { ...calendarsListed.value, [googleAccountId]: true }
  }
  const bumpSyncVersion = () => {
    syncVersion.value++
  }
  /** Drops everything cached for the current user (called on sign-out). */
  const reset = () => {
    accounts.value = []
    accountsLoaded.value = false
    calendarEvents.value = {}
    loading.value = false
    syncedAt.value = {}
    calendarsListed.value = {}
    syncVersion.value = 0
  }

  return {
    accounts,
    accountsLoaded,
    calendarEvents,
    loading,
    syncedAt,
    calendarsListed,
    syncVersion,
    allEvents,
    isLoading,
    setLoading,
    setAccounts,
    replaceCalendarEvents,
    markSynced,
    markCalendarsListed,
    bumpSyncVersion,
    reset,
  }
})
