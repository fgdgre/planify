import type { Database } from '@shared/api/supabase/types/database'

export type AppNotification = Database['public']['Tables']['notifications']['Row']
