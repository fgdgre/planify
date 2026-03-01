import { useUserStore } from "~/auth/stores/user";
import { useNotificationsStore } from "~/notification/stores/notificationStore";
import { getUser } from "~/auth/composables/user";
import { ROUTES } from "~/shared/constants/routes";

export const useInitApp = () => {
  const supabase = useSupabaseClient()
  const store = useUserStore()
  const notifications = useNotificationsStore()

  const initializeApp = async () => {
    store.setLoading(true)
    try {
      const { data: userData, error: userError } = await getUser()
      store.setAuthReady(true)
      console.log('userData', userData)
      if(userError) {
        notifications.showErrorToast({
          title: "Error",
          description: userError.message,
        })

        navigateTo(ROUTES.LOGIN)
        return
      } else if (userData?.user) {
        store.setProfile(userData?.user)
      }
    } finally {
      store.setLoading(false)
    }
  }
  const isInitialized = computed(() => store.authReady && (!store.isAuthenticated || !!store.profile))
  const isInitializing = computed(() => store.loading && !isInitialized.value)

  return {
    initializeApp,
    isAuthenticated: computed(() => store.isAuthenticated),
    isInitialized,
    isInitializing,
  }
}