import { getEnv } from '../_shared/google.ts'
import { getAllowedOrigins, resolveAllowedOrigin } from '../_shared/origins.ts'
import { OAuthStateError, verifyOAuthState } from '../_shared/oauth-state.ts'

/**
 * Step 2 of linking a Google account: Google redirects the browser here.
 *
 * This endpoint is unauthenticated by nature (Google calls it), so it must not
 * trust anything in the query string except what our own signature covers.
 * It therefore does NOT exchange the code or write to the database. It only:
 *   1. verifies the signed state (signature + age),
 *   2. checks the embedded app origin is still allow-listed,
 *   3. bounces the browser back to the app with `code` + `state`.
 *
 * The app then finishes the link in `google-oauth-complete` with the user's
 * own JWT, which is what ties the Google tokens to the right account.
 */

const SETTINGS_PATH = '/app/settings'

function redirect(target: URL): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
      'Cache-Control': 'no-store',
    },
  })
}

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const state = url.searchParams.get('state')

    if (!state) {
      return textResponse('Missing state', 400)
    }

    let payload
    try {
      payload = await verifyOAuthState(state, getEnv('OAUTH_STATE_SECRET'))
    } catch (error) {
      if (error instanceof OAuthStateError) {
        console.warn('[google-oauth-callback] rejected state:', error.reason)
        return textResponse('This sign-in link is invalid or has expired. Please start again from Planify.', 400)
      }
      throw error
    }

    const appOrigin = resolveAllowedOrigin(payload.appOrigin, getAllowedOrigins())

    if (!appOrigin) {
      console.warn('[google-oauth-callback] state origin no longer allow-listed')
      return textResponse('This sign-in link is invalid. Please start again from Planify.', 400)
    }

    const target = new URL(SETTINGS_PATH, appOrigin)
    const googleError = url.searchParams.get('error')
    const code = url.searchParams.get('code')

    if (googleError || !code) {
      target.searchParams.set('google_error', googleError === 'access_denied' ? 'access_denied' : 'oauth_failed')
      return redirect(target)
    }

    target.searchParams.set('google_code', code)
    target.searchParams.set('google_state', state)

    return redirect(target)
  } catch (error) {
    console.error('[google-oauth-callback] unhandled error:', error)
    return textResponse('Something went wrong. Please start again from Planify.', 500)
  }
})
