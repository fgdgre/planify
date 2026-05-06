import { useGoogleCalendar, useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useUserStore } from '@features/auth/stores/user'
import { useSettings } from '@features/settings/composables/settings'

export const useSettingsPage = () => {
  const route = useRoute()
  const router = useRouter()
  const { connectGoogle, fetchConnectedAccounts, deleteAccount } = useGoogleCalendar()
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
    await fetchConnectedAccounts()
    await syncAccountColors(userStore.user.id, googleCalendarStore.accounts)

    if (route.query.google_connected) {
      router.replace({ query: {} })
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
