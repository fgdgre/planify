import {
  useGoogleCalendar,
  useGoogleCalendarStore,
  EdgeFunctionError,
  getGoogleConnectErrorMessage,
} from '@features/integrations/google-calendar'
import { useUserStore } from '@features/auth/stores/user'
import { useSettings } from '@features/settings/composables/settings'
import { useNotification } from '@features/notification'

const GOOGLE_QUERY_KEYS = ['google_code', 'google_state', 'google_error', 'google_connected'] as const

export const useSettingsPage = () => {
  const route = useRoute()
  const router = useRouter()
  const { connectGoogle, completeGoogleConnection, fetchConnectedAccounts, deleteAccount } = useGoogleCalendar()
  const { getUserPreferences, syncAccountColors } = useSettings()
  const { showSuccessToast, showErrorToast } = useNotification()
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

  /**
   * The Google OAuth callback lands here with either `google_code` + `google_state`
   * (consent granted) or `google_error`. The query is stripped *before* the
   * completion request so a reload can never replay a one-time code.
   */
  const handleGoogleCallbackQuery = async () => {
    const query = route.query
    const hasGoogleQuery = GOOGLE_QUERY_KEYS.some((key) => key in query)

    if (!hasGoogleQuery) return

    const code = typeof query.google_code === 'string' ? query.google_code : null
    const state = typeof query.google_state === 'string' ? query.google_state : null
    const errorCode = typeof query.google_error === 'string' ? query.google_error : null

    const remaining = { ...query }
    for (const key of GOOGLE_QUERY_KEYS) delete remaining[key]
    await router.replace({ query: remaining })

    if (errorCode) {
      showErrorToast({ title: 'Google account not connected', description: getGoogleConnectErrorMessage(errorCode) })
      return
    }

    if (!code || !state) return

    try {
      const account = await completeGoogleConnection(code, state)
      showSuccessToast({ title: 'Google account connected', description: account.email })
    } catch (error) {
      const codeFromFunction = error instanceof EdgeFunctionError ? error.code : null
      showErrorToast({ title: 'Google account not connected', description: getGoogleConnectErrorMessage(codeFromFunction) })
    }
  }

  onMounted(async () => {
    if (!userStore.user) return

    await handleGoogleCallbackQuery()

    await getUserPreferences(userStore.user.id)
    await fetchConnectedAccounts()
    await syncAccountColors(userStore.user.id, googleCalendarStore.accounts)
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
