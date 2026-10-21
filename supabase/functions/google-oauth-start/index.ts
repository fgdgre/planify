import { buildGoogleAuthUrl, getEnv, requireUser } from '../_shared/google.ts'
import { buildCorsHeaders } from '../_shared/cors.ts'
import { HttpError, errorResponse, jsonResponse } from '../_shared/http.ts'
import { getAllowedOrigins, getDefaultAppOrigin, resolveAllowedOrigin } from '../_shared/origins.ts'
import { signOAuthState } from '../_shared/oauth-state.ts'

/**
 * Step 1 of linking a Google account.
 *
 * Caller: the logged-in browser (JWT required).
 * Returns: the Google consent URL carrying a *signed* state that binds
 *          { userId, appOrigin, ts } so the callback/complete steps can trust it.
 */
Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    if (req.method !== 'GET') {
      throw new HttpError(405, 'method_not_allowed')
    }

    const { user } = await requireUser(req.headers.get('Authorization'))

    // The frontend tells us which origin started the flow (local dev vs prod)
    // so the callback can send the browser back to the right host. Only
    // allow-listed origins are accepted; anything else is a 400.
    const requestedOrigin = new URL(req.url).searchParams.get('app_origin')
    const appOrigin = requestedOrigin
      ? resolveAllowedOrigin(requestedOrigin, getAllowedOrigins())
      : getDefaultAppOrigin()

    if (!appOrigin) {
      throw new HttpError(400, 'origin_not_allowed')
    }

    const state = await signOAuthState(
      {
        userId: user.id,
        nonce: crypto.randomUUID(),
        ts: Date.now(),
        appOrigin,
      },
      getEnv('OAUTH_STATE_SECRET'),
    )

    return jsonResponse({ url: buildGoogleAuthUrl(state) }, { headers: cors })
  } catch (error) {
    return errorResponse(error, cors)
  }
})
