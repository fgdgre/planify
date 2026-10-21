import {
  createAdminClient,
  ensureFreshAccessToken,
  requireUser,
} from '../_shared/google.ts'
import { buildCorsHeaders } from '../_shared/cors.ts'
import { HttpError, errorResponse, jsonResponse, readJsonBody, requireUuid } from '../_shared/http.ts'

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

    // Ownership check through the user client (RLS).
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

    const { accessToken, account } = await ensureFreshAccessToken(googleAccountId, user.id)

    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const json = await response.json()

    if (!response.ok) {
      throw new HttpError(502, 'google_calendar_list_failed', JSON.stringify(json))
    }

    const items = Array.isArray(json.items) ? json.items : []
    const admin = createAdminClient()

    if (items.length) {
      const rows = items.map((item: any) => ({
        user_id: account.user_id,
        google_account_id: account.id,
        calendar_id: item.id,
        summary: item.summary ?? null,
        description: item.description ?? null,
        time_zone: item.timeZone ?? null,
        is_primary: Boolean(item.primary),
        selected: Boolean(item.primary),
        updated_at: new Date().toISOString(),
      }))

      const { error: upsertError } = await admin
        .from('google_calendars')
        .upsert(rows, { onConflict: 'google_account_id,calendar_id' })

      if (upsertError) {
        throw new HttpError(500, 'db_error', upsertError.message)
      }
    }

    return jsonResponse({ items }, { headers: cors })
  } catch (error) {
    return errorResponse(error, cors)
  }
})
