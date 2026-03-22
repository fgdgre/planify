import {
  createAdminClient,
  createUserClient,
  ensureFreshAccessToken,
} from '../_shared/google.ts'
import { corsHeaders } from '../_shared/cors.ts'

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      })
    }

    const supabaseUser = createUserClient(authHeader)
    const { data: userData, error: userError } = await supabaseUser.auth.getUser()

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { googleAccountId } = await req.json()

    const { data: calendars, error: calendarsError } = await supabaseUser
      .from('google_calendars')
      .select('calendar_id')
      .eq('google_account_id', googleAccountId)
      .eq('selected', true)

    if (calendarsError) {
      throw new Error(calendarsError.message)
    }

    const { accessToken, account } = await ensureFreshAccessToken(googleAccountId)

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
        throw new Error(`Failed syncing ${calendar.calendar_id}: ${JSON.stringify(json)}`)
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
        throw new Error(upsertError.message)
      }
    }

    const { data: events, error: selectError } = await admin
      .from('calendar_events')
      .select('*')
      .eq('google_account_id', googleAccountId)
      .gte('start_at', timeMin)
      .lte('end_at', timeMax)
      .order('start_at', { ascending: true })

    if (selectError) {
      throw new Error(selectError.message)
    }

    return new Response(JSON.stringify({ synced: allRows.length, events: events ?? [] }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
