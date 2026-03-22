import { useNotification } from "@features/notification";
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";

export const useGoogleCalendar = () => {
  const supabase = useSupabaseClient()
  const config = useRuntimeConfig()

  const { showErrorToast } = useNotification()
  const googleCalendarStore = useGoogleCalendarStore()

  const getAccessToken = async () => {
    // refreshSession() ensures we always have a fresh, non-expired JWT.
    // getSession() returns a cached token that may be expired — edge functions
    // with verify_jwt=true reject expired tokens (unlike PostgREST which
    // auto-refreshes via the Supabase client).
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

  // Populates the google_calendars DB table (needed before syncEvents).
  // Does NOT store into the events store — these are calendar metadata, not events.
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

      // Always load existing events from DB first
      await loadEventsFromDb(googleAccountId)

      // Then sync fresh data from Google
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

      // Reload events after successful sync
      await loadEventsFromDb(googleAccountId)
    } catch (error: any) {
      console.error('Error syncing events:', error)
    } finally {
      googleCalendarStore.setLoading(false)
    }
  }

  const loadEventsFromDb = async (googleAccountId: string) => {
    const range = googleCalendarStore.viewRange

    // Only load events when we know the current calendar view range.
    // The range is set by the Schedule-X watcher in calendar.vue.
    if (!range) return

    const timeMin = range.start
    const timeMax = range.end

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .gte('start_at', timeMin)
      .lte('end_at', timeMax)
      .order('start_at', { ascending: true })

    console.log('loadEventsFromDb:', { googleAccountId, error, count: data?.length, timeMin, timeMax })

    if (error) {
      showErrorToast({ title: 'Error', description: error.message })
      return
    }

    googleCalendarStore.setCalendarEvents(googleAccountId, data ?? [])
  }

  return {
    connectGoogle,
    fetchConnectedAccounts,
    fetchCalendarEvents,
    syncEvents,
    loadEventsFromDb,
  }
}
