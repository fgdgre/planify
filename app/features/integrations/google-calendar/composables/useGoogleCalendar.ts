import { FunctionsHttpError } from '@supabase/supabase-js'
import { useDb } from '@shared/api/supabase'
import { useNotification } from "@features/notification";
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";
import { pickStaleAccountIds } from "@features/integrations/google-calendar/helpers/sync";
import { GOOGLE_ACCOUNT_SELECT } from "@shared/constants/google-accounts";

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

/** Reads the status and the `{ error: code }` body the Edge Functions answer failures with. */
async function toEdgeFunctionError({ context }: FunctionsHttpError): Promise<EdgeFunctionError> {
  const response = context as Response
  let payload: { error?: unknown } | null = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  return new EdgeFunctionError(response.status, typeof payload?.error === 'string' ? payload.error : 'request_failed')
}

type EdgeFunctionRequest = {
  method?: 'GET' | 'POST'
  query?: Record<string, string>
  body?: Record<string, unknown>
}

/** Shared across composable instances so overlapping callers join one sync run instead of starting another. */
let inflightSync: Promise<boolean> | null = null

export const useGoogleCalendar = () => {
  const supabase = useDb()

  const { showErrorToast } = useNotification()
  const googleCalendarStore = useGoogleCalendarStore()

  /**
   * Calls an Edge Function through the client, which adds the session's JWT and
   * the API key itself (and, in demo mode, answers from memory). The client's
   * `invoke` has no query option, so the query rides on the function name.
   * HTTP failures surface as `EdgeFunctionError` carrying the server's `error` code.
   */
  const callEdgeFunction = async <T = Record<string, unknown>>(
    name: string,
    { method = 'POST', query, body }: EdgeFunctionRequest = {},
  ): Promise<T> => {
    const path = query ? `${name}?${new URLSearchParams(query)}` : name
    const { data, error } = await supabase.functions.invoke<T>(path, { method, body })

    if (error) {
      throw error instanceof FunctionsHttpError ? await toEdgeFunctionError(error) : error
    }

    return data as T
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
