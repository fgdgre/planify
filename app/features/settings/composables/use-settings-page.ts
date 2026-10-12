import { useGoogleCalendar, useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useUserStore } from '@features/auth/stores/user'
import { useSettings } from '@features/settings/composables/settings'

export const useSettingsPage = () => {
  const route = useRoute()
  const router = useRouter()
  const { connectGoogle, fetchConnectedAccounts, deleteAccount, syncAllAccounts } = useGoogleCalendar()
  const { getUserPreferences, syncAccountColors } = useSettings()
  const googleCalendarStore = useGoogleCalendarStore()
  const userStore = useUserStore()
  const { accounts, isLoading } = storeToRefs(googleCalendarStore)

  const isColorsDirty = ref(false)
  const isColorsSaving = ref(false)
  const colorsSaveSignal = ref(0)
  const colorsDiscardSignal = ref(0)

  const requestColorsSave = () => {
    colorsSaveSignal.value++
  }

  const requestColorsDiscard = () => {
    colorsDiscardSignal.value++
  }

  onMounted(async () => {
    if (!userStore.user) return

    await getUserPreferences(userStore.user.id)
    // Settings is where accounts get connected and removed, so always show the fresh list here.
    await fetchConnectedAccounts({ force: true })
    await syncAccountColors(userStore.user.id, googleCalendarStore.accounts)

    if (route.query.google_connected) {
      router.replace({ query: {} })
      // List the new account's calendars and pull its events now, not on the next calendar visit.
      void syncAllAccounts()
    }
  })

  return {
    accounts,
    isLoading,
    connectGoogle,
    deleteAccount,
    isColorsDirty,
    isColorsSaving,
    colorsSaveSignal,
    colorsDiscardSignal,
    requestColorsSave,
    requestColorsDiscard,
  }
}
