import {
  createAdminClient,
  exchangeCodeForTokens,
  getEnv,
  getGoogleProfile,
  requireUser,
} from '../_shared/google.ts'
import { buildCorsHeaders } from '../_shared/cors.ts'
import { HttpError, errorResponse, jsonResponse, readJsonBody } from '../_shared/http.ts'
import { OAuthStateError, verifyOAuthState } from '../_shared/oauth-state.ts'

/**
 * Step 3 of linking a Google account.
 *
 * Caller: the logged-in browser (JWT required) with `{ code, state }` taken
 *         from the query string the callback redirected it to.
 *
 * Security properties:
 *   - `state` must carry our signature and be younger than 10 minutes.
 *   - `state.userId` must equal the JWT user. A victim who is tricked into
 *     completing an attacker's consent URL therefore gets a 403, and the
 *     victim's Google tokens are never stored under the attacker's account.
 *   - The row is written with `user_id = <JWT user>`, never a value from the
 *     request body.
 */
Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    if (req.method !== 'POST') {
      throw new HttpError(405, 'method_not_allowed')
    }

    const { user } = await requireUser(req.headers.get('Authorization'))

    const body = await readJsonBody<{ code?: unknown; state?: unknown }>(req)

    if (typeof body.code !== 'string' || !body.code || typeof body.state !== 'string' || !body.state) {
      throw new HttpError(400, 'invalid_request')
    }

    let payload
    try {
      payload = await verifyOAuthState(body.state, getEnv('OAUTH_STATE_SECRET'))
    } catch (error) {
      if (error instanceof OAuthStateError) {
        throw new HttpError(400, error.reason === 'expired' ? 'state_expired' : 'invalid_state')
      }
      throw error
    }

    if (payload.userId !== user.id) {
      throw new HttpError(403, 'state_user_mismatch')
    }

    const tokenData = await exchangeCodeForTokens(body.code)

    if (!tokenData.refresh_token) {
      // Happens when the Google grant already existed without `prompt=consent`.
      throw new HttpError(400, 'no_refresh_token')
    }

    const profile = await getGoogleProfile(tokenData.access_token)

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : []

    const admin = createAdminClient()

    const { error } = await admin
      .from('google_accounts')
      .upsert(
        {
          user_id: user.id,
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
      throw new HttpError(500, 'db_error', error.message)
    }

    return jsonResponse(
      {
        ok: true,
        account: {
          email: profile.email,
          display_name: profile.name ?? null,
        },
      },
      { headers: cors },
    )
  } catch (error) {
    return errorResponse(error, cors)
  }
})
