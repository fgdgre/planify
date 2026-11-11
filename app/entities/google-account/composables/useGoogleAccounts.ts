import { useDb } from '@shared/api/supabase'
import { useToast } from '@shared/lib/toast'
import { GOOGLE_ACCOUNT_SELECT } from '@shared/constants/google-accounts'
import { useGoogleCalendarStore } from '../stores/google-calendar'
import { API } from '@shared/constants/api'

export const useGoogleAccounts = () => {
  const supabase = useDb()
  const { showErrorToast } = useToast()
  const googleCalendarStore = useGoogleCalendarStore()

  const fetchConnectedAccounts = async (options: { force?: boolean } = {}) => {
    if (googleCalendarStore.accountsLoaded && !options.force) return

    try {
      googleCalendarStore.setLoading(true)

      const { data, error } = await supabase
        .from(API.TABLES.GOOGLE_ACCOUNTS)
        .select(GOOGLE_ACCOUNT_SELECT)
        .order('created_at', { ascending: false })

      if (error) {
        showErrorToast({ title: 'Error', description: error.message })
        return
      }

      googleCalendarStore.setAccounts(data ?? [])
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: error.message })
    } finally {
      googleCalendarStore.setLoading(false)
    }
  }

  return { fetchConnectedAccounts }
}
