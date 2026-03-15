import {
  createAdminClient,
  exchangeCodeForTokens,
  getEnv,
  getGoogleProfile,
} from '../_shared/google.ts'

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code || !state) {
      return new Response('Missing code or state', { status: 400 })
    }

    let parsedState: { userId: string; nonce: string; ts: number }

    try {
      parsedState = JSON.parse(atob(state))
    } catch {
      return new Response('Invalid state', { status: 400 })
    }

    const tokenData = await exchangeCodeForTokens(code)
    const profile = await getGoogleProfile(tokenData.access_token)

    if (!tokenData.refresh_token) {
      return new Response(
        'No refresh token returned by Google. Reconnect with prompt=consent and remove previous grant if needed.',
        { status: 400 }
      )
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : []

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('google_accounts')
      .upsert(
        {
          user_id: parsedState.userId,
          google_user_id: profile.id,
          email: profile.email,
          display_name: profile.name ?? null,
          picture_url: profile.picture ?? null,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          scopes,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,google_user_id',
        }
      )

    if (error) {
      throw new Error(error.message)
    }

    const appBaseUrl = getEnv('APP_BASE_URL')
    return Response.redirect(`${appBaseUrl}/integrations?google_connected=1`, 302)
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Unknown error', {
      status: 500,
    })
  }
})
