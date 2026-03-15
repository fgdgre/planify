import { useUserStore } from "../stores/user";
import { getUser } from "./user";
import { useNotification } from "@features/notification";
import { ROUTES } from "@shared/constants/routes";

export const useInitApp = () => {
  const userStore = useUserStore()
  const { showErrorToast } = useNotification()
  const isInitializing = computed(() => userStore.loading && userStore.initPromise != null)
  const initializeApp = async () => {
    userStore.setLoading(true)
    try {
      const { data: userData, error: userError } = await getUser()
      console.log('userData', userData)
      if(userError) {
        showErrorToast({
          title: "Error",
          description: userError.message,
        })

        navigateTo(ROUTES.LOGIN)
        return
      } else if (userData?.user) {
        userStore.setUser(userData.user)
      }
    } finally {
      userStore.setLoading(false)
    }
  }

  return {
    initializeApp,
    isInitializing,
  }
}
