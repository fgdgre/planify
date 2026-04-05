import { useNotification } from "@features/notification";
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";

export const useGoogleCalendar = () => {
  const supabase = useSupabaseClient()
  const config = useRuntimeConfig()

  const { showErrorToast } = useNotification()
  const googleCalendarStore = useGoogleCalendarStore()

  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error('Failed to refresh session:', error)
    }

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

    const { data } = await supabase.auth.refreshSession()
    const accessToken = data.session?.access_token

    if (!accessToken) {
      throw new Error('No active session')
    }

    const appOrigin = window.location.origin
    const functionUrl = `${config.public.supabaseUrl}/functions/v1/google-oauth-start?app_origin=${encodeURIComponent(appOrigin)}`

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

      if (!response.ok) {
        console.error('Failed to load calendars:', response.status)
        showErrorToast({ title: 'Error', description: 'Failed to load calendars' })
      }
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: error.message })
      console.error('Error loading calendars:', error)
    }
  }

  const syncEvents = async (googleAccountId: string) => {
    try {
      googleCalendarStore.setLoading(true)

      await loadEventsFromDb(googleAccountId)

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

      if (!response.ok) {
        console.error('Sync failed:', response.status, await response.text())
        return
      }

      await loadEventsFromDb(googleAccountId)
    } catch (error: any) {
      console.error('Error syncing events:', error)
    } finally {
      googleCalendarStore.setLoading(false)
    }
  }

  /**
   * Load events from DB for a given account.
   * Accepts an optional range; if omitted, loads without date filtering (used during sync).
   */
  const loadEventsFromDb = async (
    googleAccountId: string,
    range?: { start: string; end: string },
  ) => {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .order('start_at', { ascending: true })

    if (range) {
      query = query.gte('start_at', range.start).lte('end_at', range.end)
    }

    const { data, error } = await query

    console.log('loadEventsFromDb:', { googleAccountId, error, count: data?.length })

    if (error) {
      showErrorToast({ title: 'Error', description: error.message })
      return
    }

    googleCalendarStore.setCalendarEvents(googleAccountId, data ?? [])
  }

  const deleteAccount = async (accountId: string) => {
    try {
      googleCalendarStore.setLoading(true)

      const { error } = await supabase
        .from('google_accounts')
        .delete()
        .eq('id', accountId)

      if (error) {
        showErrorToast({ title: 'Error', description: error.message })
        return
      }

      googleCalendarStore.setAccounts(
        googleCalendarStore.accounts.filter((a) => a.id !== accountId)
      )
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: error.message })
    } finally {
      googleCalendarStore.setLoading(false)
    }
  }

  return {
    connectGoogle,
    fetchConnectedAccounts,
    fetchCalendarEvents,
    syncEvents,
    loadEventsFromDb,
    deleteAccount,
  }
}
