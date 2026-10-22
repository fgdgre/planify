import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/types/database'

type DbClient = SupabaseClient<Database>

let factory: (() => DbClient) | null = null

/**
 * Where the demo's fake database client plugs into `useDb()`.
 *
 * The fake client and its seed are only needed in demo mode, so they live in a
 * lazily loaded chunk (see `install.ts`) instead of the entry bundle every
 * visitor downloads. That chunk registers its factory here at boot, before any
 * page code can call `useDb()`, which keeps `useDb()` synchronous.
 */
export function registerDemoClientFactory(create: () => DbClient): void {
  factory = create
}

/** The demo client. Throws if the demo backend was not installed first: a boot-order bug that must be loud, never a silent fallback to the real client. */
export function getDemoClient(): DbClient {
  if (!factory) throw new Error('Demo client requested before the demo backend was installed')
  return factory()
}

/** Test-only: forgets the registered factory. */
export function __resetDemoClientRegistryForTests(): void {
  factory = null
}
