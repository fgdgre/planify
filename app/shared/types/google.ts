import type { Database } from '../api/supabase/types/database'
import type { GoogleAccountPublicColumn } from '../constants/google-accounts'

type GoogleAccountRow = Database['public']['Tables']['google_accounts']['Row']

/**
 * The browser-visible shape of a Google account. Token columns are not part of
 * it on purpose; they are only ever handled by the Edge Functions.
 */
export type GoogleAccount = Pick<GoogleAccountRow, GoogleAccountPublicColumn>
