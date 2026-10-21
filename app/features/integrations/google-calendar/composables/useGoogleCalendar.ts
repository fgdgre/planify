import { useNotification } from "@features/notification";
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";
import { pickStaleAccountIds } from "@features/integrations/google-calendar/helpers/sync";
import { GOOGLE_ACCOUNT_SELECT } from "@shared/constants/google-accounts";
import type { Database } from "@shared/api/supabase/types/database";

/** Error thrown when an Edge Function answers with a non-2xx status. */
export class EdgeFunctionError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`Edge function failed: ${code} (${status})`)
    this.name = 'EdgeFunctionError'
  }
}

type EdgeFunctionRequest = {
  method?: 'GET' | 'POST'
  query?: Record<string, string>
  body?: Record<string, unknown>
}

/** Shared across composable instances so overlapping callers join one sync run instead of starting another. */
let inflightSync: Promise<boolean> | null = null

export const useGoogleCalendar = () => {
  const supabase = useSupabaseClient<Database>()
  const config = useRuntimeConfig()

  const { showErrorToast } = useNotification()
  const googleCalendarStore = useGoogleCalendarStore()

  // Reads the cached session. supabase-js refreshes it on its own only when the
  // access token is about to expire, so on a healthy session this costs no
  // network call. (`refreshSession()` forced a token rotation on every call.)
  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Failed to read session:', error.message)
    }

    const token = data.session?.access_token

    if (!token) {
      throw new Error('No active session')
    }

    return token
  }

  const callEdgeFunction = async <T = Record<string, unknown>>(
    name: string,
    { method = 'POST', query, body }: EdgeFunctionRequest = {},
  ): Promise<T> => {
    if (!config.public.supabaseUrl) {
      throw new Error('Missing public.supabaseUrl')
    }

    const accessToken = await getAccessToken()
    const url = new URL(`${config.public.supabaseUrl}/functions/v1/${name}`)

    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value)
    }

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    let payload: any = null
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      throw new EdgeFunctionError(response.status, typeof payload?.error === 'string' ? payload.error : 'request_failed')
    }

    return payload as T
  }

  const connectGoogle = async () => {
    const { url } = await callEdgeFunction<{ url?: string }>('google-oauth-start', {
      method: 'GET',
      query: { app_origin: window.location.origin },
    })

    if (!url) {
      throw new Error('OAuth URL not returned')
    }

    window.location.href = url
  }

  /**
   * Finishes a Google connection started by `connectGoogle`. The callback
   * function sends the browser back to /app/settings with `code` + `state`;
   * this call hands them to `google-oauth-complete` together with the user's
   * own JWT, which is what binds the Google tokens to the right account.
   */
  const completeGoogleConnection = async (code: string, state: string) => {
    const { account } = await callEdgeFunction<{ ok: true; account: { email: string; display_name: string | null } }>(
      'google-oauth-complete',
      { body: { code, state } },
    )

    return account
  }

  /** Loads the user's Google accounts once per session; pass `force` where a fresh list matters (settings). */
  const fetchConnectedAccounts = async (options: { force?: boolean } = {}) => {
    if (googleCalendarStore.accountsLoaded && !options.force) return

    try {
      googleCalendarStore.setLoading(true)

      // Explicit column list: token columns are not readable by the browser.
      const { data, error } = await supabase
        .from('google_accounts')
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

  /** Refreshes the `google_calendars` rows for one account from Google's calendarList. */
  const listCalendars = async (googleAccountId: string) => {
    try {
      await callEdgeFunction('google-list-calendars', { body: { googleAccountId } })
      googleCalendarStore.markCalendarsListed(googleAccountId)
      return true
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: 'Failed to load calendars' })
      console.error('Error loading calendars:', error?.code ?? error?.message)
      return false
    }
  }

  /** Asks the edge function to pull one account's events from Google into `calendar_events`. */
  const syncEvents = async (googleAccountId: string) => {
    try {
      await callEdgeFunction('google-sync-events', { body: { googleAccountId } })
      googleCalendarStore.markSynced(googleAccountId, Date.now())
      return true
    } catch (error: any) {
      console.error('Error syncing events:', error?.code ?? error?.message)
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
    completeGoogleConnection,
    fetchConnectedAccounts,
    listCalendars,
    syncEvents,
    syncAllAccounts,
    deleteAccount,
  }
}
