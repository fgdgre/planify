import {
  createAdminClient,
  createUserClient,
  ensureFreshAccessToken,
} from '../_shared/google.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
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

    const { data: ownedAccount, error: ownedError } = await supabaseUser
      .from('google_accounts')
      .select('id')
      .eq('id', googleAccountId)
      .single()

    if (ownedError || !ownedAccount) {
      return new Response(JSON.stringify({ error: 'Google account not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { accessToken, account } = await ensureFreshAccessToken(googleAccountId)

    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const json = await response.json()

    if (!response.ok) {
      throw new Error(JSON.stringify(json))
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
        throw new Error(upsertError.message)
      }
    }

    return new Response(JSON.stringify({ items }), {
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
