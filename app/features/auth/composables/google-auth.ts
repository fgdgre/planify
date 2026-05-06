import { useNotification } from "@features/notification";
import { ROUTES } from "@shared/constants/routes";

export const useGoogleAuth = () => {
  const supabase = useSupabaseClient()
  const { showErrorToast } = useNotification()

  const loading = ref(false)

  const signInWithGoogle = async () => {
    loading.value = true

    try {
      const redirectTo = `${window.location.origin}${ROUTES.HOME}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        showErrorToast({ title: 'Error', description: error.message })
        loading.value = false
      }
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: error?.message || 'Failed to start Google sign-in' })
      loading.value = false
    }
  }

  return {
    loading,
    signInWithGoogle,
  }
}
