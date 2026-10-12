import { useNotification } from "@features/notification";
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";
import { pickStaleAccountIds } from "@features/integrations/google-calendar/helpers/sync";

/** Shared across composable instances so overlapping callers join one sync run instead of starting another. */
let inflightSync: Promise<boolean> | null = null

export const useGoogleCalendar = () => {
  const supabase = useSupabaseClient()
  const config = useRuntimeConfig()

  const { showErrorToast } = useNotification()
  const googleCalendarStore = useGoogleCalendarStore()

  // Reads the cached session. supabase-js refreshes it on its own only when the
  // access token is about to expire, so on a healthy session this costs no
  // network call. (`refreshSession()` forced a token rotation on every call.)
  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Failed to read session:', error)
    }

    const token = data.session?.access_token

    if (!token) {
      throw new Error('No active session')
    }

    return token
  }

  const callEdgeFunction = async (name: string, body: Record<string, unknown>) => {
    const accessToken = await getAccessToken()

    return fetch(`${config.public.supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })
  }

  const connectGoogle = async () => {
    if (!config.public.supabaseUrl) {
      throw new Error('Missing public.supabaseUrl')
    }

    const accessToken = await getAccessToken()
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

  /** Loads the user's Google accounts once per session; pass `force` where a fresh list matters (settings). */
  const fetchConnectedAccounts = async (options: { force?: boolean } = {}) => {
    if (googleCalendarStore.accountsLoaded && !options.force) return

    try {
      googleCalendarStore.setLoading(true)

      const { data, error } = await supabase
        .from('google_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        showErrorToast({ title: 'Error', description: error.message })
        return
      }

      googleCalendarStore.setAccounts(data)
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: error.message })
      console.error('Error loading accounts:', error)
    } finally {
      googleCalendarStore.setLoading(false)
    }
  }

  /** Refreshes the `google_calendars` rows for one account from Google's calendarList. */
  const listCalendars = async (googleAccountId: string) => {
    try {
      const response = await callEdgeFunction('google-list-calendars', { googleAccountId })

      if (!response.ok) {
        console.error('Failed to load calendars:', response.status)
        showErrorToast({ title: 'Error', description: 'Failed to load calendars' })
        return false
      }

      googleCalendarStore.markCalendarsListed(googleAccountId)
      return true
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: error.message })
      console.error('Error loading calendars:', error)
      return false
    }
  }

  /** Asks the edge function to pull one account's events from Google into `calendar_events`. */
  const syncEvents = async (googleAccountId: string) => {
    try {
      const response = await callEdgeFunction('google-sync-events', { googleAccountId })

      if (!response.ok) {
        console.error('Sync failed:', response.status, await response.text())
        return false
      }

      googleCalendarStore.markSynced(googleAccountId, Date.now())
      return true
    } catch (error: any) {
      console.error('Error syncing events:', error)
      return false
    }
  }

  /**
   * Syncs every connected account whose cache is older than SYNC_TTL_MS (every
   * account when `force`). Calendars are listed once per session per account,
   * or again on a forced refresh, since the list rarely changes. Resolves to
   * true when at least one account synced; open views reload via `syncVersion`.
   */
  const syncAllAccounts = async (options: { force?: boolean } = {}): Promise<boolean> => {
    if (inflightSync) return inflightSync

    inflightSync = (async () => {
      const accountIds = googleCalendarStore.accounts.map((account) => account.id)
      const staleIds = pickStaleAccountIds(accountIds, googleCalendarStore.syncedAt, Date.now(), {
        force: options.force,
      })

      if (!staleIds.length) return false

      googleCalendarStore.setLoading(true)

      try {
        const results = await Promise.all(
          staleIds.map(async (googleAccountId) => {
            if (options.force || !googleCalendarStore.calendarsListed[googleAccountId]) {
              const listed = await listCalendars(googleAccountId)
              if (!listed) return false
            }

            return syncEvents(googleAccountId)
          }),
        )

        const synced = results.some(Boolean)

        if (synced) {
          googleCalendarStore.bumpSyncVersion()
        }

        return synced
      } finally {
        googleCalendarStore.setLoading(false)
        inflightSync = null
      }
    })()

    return inflightSync
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
    listCalendars,
    syncEvents,
    syncAllAccounts,
    deleteAccount,
  }
}
