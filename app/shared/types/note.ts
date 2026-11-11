import type { Database } from '@shared/api/supabase/types/database'

export type Note = Database['public']['Tables']['notes']['Row']
