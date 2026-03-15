import type { Database } from '../api/supabase/types/database'

export type GoogleAccount = Database['public']['Tables']['google_accounts']['Row']
