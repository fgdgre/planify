/**
 * User-facing copy for the error codes the Google OAuth Edge Functions return
 * (`google-oauth-callback` via `?google_error=`, `google-oauth-complete` via
 * `{ error }`). The functions never send raw error text, only these codes.
 */
const GOOGLE_CONNECT_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Google access was declined, so no account was connected.',
  oauth_failed: 'Google sign-in did not complete. Please try again.',
  state_expired: 'This Google connection link has expired. Please start again.',
  invalid_state: 'This Google connection link is not valid. Please start again.',
  state_user_mismatch: 'This Google connection was started from a different Planify account.',
  no_refresh_token: 'Google did not grant offline access. Remove Planify from your Google account permissions and try again.',
  origin_not_allowed: 'This site is not allowed to connect Google accounts.',
}

const DEFAULT_GOOGLE_CONNECT_ERROR = 'Could not connect the Google account. Please try again.'

export const getGoogleConnectErrorMessage = (code?: string | null) =>
  (code && GOOGLE_CONNECT_ERROR_MESSAGES[code]) || DEFAULT_GOOGLE_CONNECT_ERROR
