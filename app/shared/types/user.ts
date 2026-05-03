import type { User as SupabaseAuthUser } from '@supabase/supabase-js'

export interface UserMetadata {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

export type User = SupabaseAuthUser & {
  user_metadata: UserMetadata & SupabaseAuthUser['user_metadata']
}
