import type { Database } from '../api/supabase/types/database'

export type User = Database['public']['Tables']['profiles']['Row']
