import {
  createAdminClient,
  ensureFreshAccessToken,
  requireUser,
} from '../_shared/google.ts'
import { buildCorsHeaders } from '../_shared/cors.ts'
import { HttpError, errorResponse, jsonResponse, readJsonBody, requireUuid } from '../_shared/http.ts'

function normalizeGoogleEvent(event: any) {
  const startDateTime = event.start?.dateTime ?? null
  const endDateTime = event.end?.dateTime ?? null
  const startDate = event.start?.date ?? null
  const endDate = event.end?.date ?? null

  const allDay = Boolean(startDate && !startDateTime)

  return {
    title: event.summary ?? '(No title)',
    description: event.description ?? null,
    location: event.location ?? null,
    start_at: allDay ? `${startDate}T00:00:00.000Z` : startDateTime,
    end_at: allDay ? `${endDate}T00:00:00.000Z` : endDateTime,
    all_day: allDay,
    status: event.status ?? 'confirmed',
    organizer_email: event.organizer?.email ?? null,
    creator_email: event.creator?.email ?? null,
    html_link: event.htmlLink ?? null,
    etag: event.etag ?? null,
    updated_at_google: event.updated ?? null,
  }
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, 'method_not_allowed')
    }

    const { user, supabase: supabaseUser } = await requireUser(req.headers.get('Authorization'))

    const body = await readJsonBody<{ googleAccountId?: unknown }>(req)
    const googleAccountId = requireUuid(body.googleAccountId)

    // Ownership check through the user client (RLS): the account must be the
    // caller's own. Without this any logged-in user could sync and read the
    // cached events of someone else's account by guessing its id.
    const { data: ownedAccount, error: ownedError } = await supabaseUser
      .from('google_accounts')
      .select('id')
      .eq('id', googleAccountId)
      .maybeSingle()

    if (ownedError) {
      throw new HttpError(500, 'db_error', ownedError.message)
    }

    if (!ownedAccount) {
      throw new HttpError(404, 'google_account_not_found')
    }

    const { data: calendars, error: calendarsError } = await supabaseUser
      .from('google_calendars')
      .select('calendar_id')
      .eq('google_account_id', googleAccountId)
      .eq('selected', true)

    if (calendarsError) {
      throw new HttpError(500, 'db_error', calendarsError.message)
    }

    const { accessToken, account } = await ensureFreshAccessToken(googleAccountId, user.id)

    const admin = createAdminClient()
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

    const allRows: any[] = []

    for (const calendar of calendars ?? []) {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '2500',
      })

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.calendar_id)}/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const json = await response.json()

      if (!response.ok) {
        throw new HttpError(502, 'google_sync_failed', `Failed syncing ${calendar.calendar_id}: ${JSON.stringify(json)}`)
      }

      const items = Array.isArray(json.items) ? json.items : []

      for (const event of items) {
        const normalized = normalizeGoogleEvent(event)

        if (!normalized.start_at || !normalized.end_at) {
          continue
        }

        allRows.push({
          user_id: account.user_id,
          google_account_id: account.id,
          calendar_id: calendar.calendar_id,
          external_event_id: event.id,
          ...normalized,
          synced_at: new Date().toISOString(),
        })
      }
    }

    if (allRows.length) {
      const { error: upsertError } = await admin
        .from('calendar_events')
        .upsert(allRows, {
          onConflict: 'google_account_id,calendar_id,external_event_id',
        })

      if (upsertError) {
        throw new HttpError(500, 'db_error', upsertError.message)
      }
    }

    const { data: events, error: selectError } = await admin
      .from('calendar_events')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .eq('user_id', user.id)
      .gte('start_at', timeMin)
      .lte('end_at', timeMax)
      .order('start_at', { ascending: true })

    if (selectError) {
      throw new HttpError(500, 'db_error', selectError.message)
    }

    return jsonResponse({ synced: allRows.length, events: events ?? [] }, { headers: cors })
  } catch (error) {
    return errorResponse(error, cors)
  }
})
