export const useGoogleCalendar = () => {
  const supabase = useSupabaseClient()
  const config = useRuntimeConfig()

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

    console.log('functionUrl', functionUrl)

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

  const getConnectedAccounts = async () => {
    const { data, error } = await supabase
      .from('google_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data
  }

  const loadCalendars = async (googleAccountId: string) => {
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
      throw new Error(json.error || 'Failed to load calendars')
    }

    return json.items
  }

  const syncEvents = async (googleAccountId: string) => {
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
      throw new Error(json.error || 'Failed to sync events')
    }

    return json
  }

  return {
    connectGoogle,
    getConnectedAccounts,
    loadCalendars,
    syncEvents,
  }
}
