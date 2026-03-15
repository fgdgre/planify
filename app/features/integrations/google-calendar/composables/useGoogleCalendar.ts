import { useNotification } from "@features/notification";
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";

export const useGoogleCalendar = () => {
  const supabase = useSupabaseClient()
  const config = useRuntimeConfig()

  const { showErrorToast } = useNotification()
  const googleCalendarStore = useGoogleCalendarStore()

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) {
      throw new Error('No active session')
    }

    return token
  }

  const connectGoogle = async () => {
    const config = useRuntimeConfig()
    const supabase = useSupabaseClient()

    if (!config.public.supabaseUrl) {
      throw new Error('Missing public.supabaseUrl')
    }

    const { data } = await supabase.auth.getSession()
    const accessToken = data.session?.access_token

    if (!accessToken) {
      throw new Error('No active session')
    }

    const functionUrl = `${config.public.supabaseUrl}/functions/v1/google-oauth-start`

    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const text = await response.text()

    if (!response.ok) {
      throw new Error(text || 'Failed to start Google OAuth')
    }

    const json = JSON.parse(text)

    if (!json.url) {
      throw new Error('OAuth URL not returned')
    }

    window.location.href = json.url
  }

  const fetchConnectedAccounts = async () => {
    try {
      googleCalendarStore.setLoading(true)

      const { data, error } = await supabase
        .from('google_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if(error) {
        showErrorToast({ title: 'Error', description: error.message })
        return
      }
      console.log('Connected accounts:', data)
      googleCalendarStore.setAccounts(data)
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: error.message })
      console.error('Error loading accounts:', error)
    } finally {
      googleCalendarStore.setLoading(false)
    }
  }

  const fetchCalendarEvents = async (googleAccountId: string) => {
    try {
      googleCalendarStore.setLoading(true)

      const accessToken = await getAccessToken()
      const response = await fetch(
        `${config.public.supabaseUrl}/functions/v1/google-list-calendars`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ googleAccountId }),
        }
      )
      const json = await response.json()

      if (!response.ok) {
        showErrorToast({ title: 'Error', description: 'Failed to load calendars' })
      }
      console.log(googleAccountId)
      console.log('Loaded calendars:', json)
      googleCalendarStore.setCalendarEvents(googleAccountId, json.items)
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: error.message })
      console.error('Error loading calendars:', error)
    } finally {
      googleCalendarStore.setLoading(false)
    }
  }

  const syncEvents = async (googleAccountId: string) => {
    try {
      googleCalendarStore.setLoading(true)

      const accessToken = await getAccessToken()
      const response = await fetch(
        `${config.public.supabaseUrl}/functions/v1/google-sync-events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ googleAccountId }),
        }
      )
      const json = await response.json()

      if (!response.ok) {
        showErrorToast({ title: 'Error', description: 'Failed to sync events' })
        return
      }

      console.log('Synced events:', json)
      googleCalendarStore.setCalendarEvents(googleAccountId, json)
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: error.message })
      console.error('Error syncing events:', error)
    } finally {
      googleCalendarStore.setLoading(false)
    }
  }

  return {
    connectGoogle,
    fetchConnectedAccounts,
    fetchCalendarEvents,
    syncEvents,
  }
}
