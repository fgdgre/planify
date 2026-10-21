import { useNotification } from "@features/notification";
import { useGoogleCalendarStore } from "@features/integrations/google-calendar/stores/google-calendar";
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

export const useGoogleCalendar = () => {
  const supabase = useSupabaseClient<Database>()
  const config = useRuntimeConfig()

  const { showErrorToast } = useNotification()
  const googleCalendarStore = useGoogleCalendarStore()

  const getAccessToken = async () => {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) {
      console.error('Failed to refresh session:', error.message)
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

  const fetchConnectedAccounts = async () => {
    try {
      googleCalendarStore.setLoading(true)

      // Explicit column list: token columns are not readable by the browser.
      const { data, error } = await supabase
        .from('google_accounts')
        .select(GOOGLE_ACCOUNT_SELECT)
        .order('created_at', { ascending: false })

      if(error) {
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

  const fetchCalendarEvents = async (googleAccountId: string) => {
    try {
      await callEdgeFunction('google-list-calendars', { body: { googleAccountId } })
    } catch (error: any) {
      showErrorToast({ title: 'Error', description: 'Failed to load calendars' })
      console.error('Error loading calendars:', error?.code ?? error?.message)
    }
  }

  const syncEvents = async (googleAccountId: string) => {
    try {
      googleCalendarStore.setLoading(true)

      await loadEventsFromDb(googleAccountId)

      await callEdgeFunction('google-sync-events', { body: { googleAccountId } })

      await loadEventsFromDb(googleAccountId)
    } catch (error: any) {
      console.error('Error syncing events:', error?.code ?? error?.message)
    } finally {
      googleCalendarStore.setLoading(false)
    }
  }

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
    completeGoogleConnection,
    fetchConnectedAccounts,
    fetchCalendarEvents,
    syncEvents,
    loadEventsFromDb,
    deleteAccount,
  }
}
