import { useUserStore } from "../stores/user";
import { getUser } from "./user";
import { useNotification } from "@modules/notification";
import { ROUTES } from "@constants/routes";

export const useInitApp = () => {
  const store = useUserStore()
  const { showErrorToast } = useNotification()
  const initializeApp = async () => {
    store.setLoading(true)
    try {
      const { data: userData, error: userError } = await getUser()
      store.setAuthReady(true)
      console.log('userData', userData)
      if(userError) {
        showErrorToast({
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