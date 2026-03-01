import { useNotificationsStore } from "~/notification/stores/notificationStore";
import { useUserStore } from "~/auth/stores/user";

export const logout = async () => {
  const supabase = useSupabaseClient()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()

  const { error } = await supabase.auth.signOut({ scope: 'local' })

  if(error) {
    notificationsStore.showErrorToast({
      title: "Error",
      description: error.message,
    })
    return
  }

  userStore.setClear()
  navigateTo('/login', { replace: true })
}