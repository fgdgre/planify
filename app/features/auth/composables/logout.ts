import { useNotification } from "@features/notification"
import { useUserStore } from "../stores/user";

export const useLogout = () => {
  const supabase = useSupabaseClient()
  const userStore = useUserStore()
  const { showErrorToast } = useNotification()

  const loading = ref(false)

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if(error) {
        showErrorToast({
          title: "Error",
          description: error.message,
        })
        return
      }

      userStore.setClear()
      navigateTo('/login', { replace: true })
    } catch (e) {
      console.log(e)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    logout,
  }
}
