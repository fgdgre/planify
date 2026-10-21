/**
 * Columns of `public.google_accounts` the browser is allowed to read.
 *
 * `access_token` and `refresh_token` are deliberately absent: the database
 * grants `authenticated` SELECT on exactly this column list (see
 * supabase/migrations/20261013000000_google_accounts_token_column_grants.sql),
 * so a `select('*')` would fail with 42501 and, more importantly, tokens never
 * reach DevTools, extensions or Playwright traces.
 */
export const GOOGLE_ACCOUNT_PUBLIC_COLUMNS = [
  'id',
  'user_id',
  'google_user_id',
  'email',
  'display_name',
  'picture_url',
  'expires_at',
  'scopes',
  'is_active',
  'created_at',
  'updated_at',
] as const

export type GoogleAccountPublicColumn = (typeof GOOGLE_ACCOUNT_PUBLIC_COLUMNS)[number]

/** Literal select string so supabase-js can infer the narrowed row type. */
export const GOOGLE_ACCOUNT_SELECT =
  'id, user_id, google_user_id, email, display_name, picture_url, expires_at, scopes, is_active, created_at, updated_at' as const
