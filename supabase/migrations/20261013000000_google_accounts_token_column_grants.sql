-- Google OAuth tokens must never reach the browser.
--
-- Before this migration `authenticated` held table-level SELECT on
-- public.google_accounts, so `select('*')` from the Nuxt client returned the
-- plaintext `access_token` / `refresh_token` of the user's own rows (RLS only
-- limits *which rows*, not *which columns*). Any XSS, browser extension or
-- shared machine could exfiltrate long-lived calendar-write tokens.
--
-- Postgres ignores a column-level REVOKE while a table-level grant exists, so
-- the table-level SELECT is revoked first and only the non-secret columns are
-- granted back. The service role (used by the Edge Functions) is unaffected.
--
-- After this runs, `select('*')` on google_accounts from the client fails with
-- 42501; the app selects the explicit column list in
-- app/shared/constants/google-accounts.ts.

begin;

revoke select on table public.google_accounts from anon, authenticated;

grant select (
  id,
  user_id,
  google_user_id,
  email,
  display_name,
  picture_url,
  expires_at,
  scopes,
  is_active,
  created_at,
  updated_at
) on table public.google_accounts to authenticated;

commit;
