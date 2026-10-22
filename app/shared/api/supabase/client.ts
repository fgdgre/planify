import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types/database'
import { fetchWithRetry } from './fetch-with-retry'
import { getFakeClient, isDemoMode, __resetFakeClientForTests } from '../demo'

type DbClient = SupabaseClient<Database>

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8

let client: DbClient | null = null
let pendingCallbacks: Array<(client: DbClient) => void> = []

/**
 * Name of the cookie holding the auth session: `sb-<project-ref>-auth-token`.
 * Kept identical to the one `@nuxtjs/supabase` used so already signed-in users stay signed in.
 */
function getSessionCookieName(supabaseUrl: string): string {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  return `sb-${projectRef}-auth-token`
}

function createDbClient(): DbClient {
  const { supabaseUrl, supabaseAnonKey } = useRuntimeConfig().public

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: 'pkce' },
    cookieOptions: {
      name: getSessionCookieName(supabaseUrl),
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
      sameSite: 'lax',
      secure: true,
    },
    isSingleton: true,
    global: { fetch: fetchWithRetry },
  })
}

/**
 * Returns the app-wide Supabase client, creating it on first call.
 *
 * Creation is lazy so pages that never touch the backend (marketing pages) never
 * build a client, read the session or send an auth request. Call it where the
 * data is needed, not at module top level. It is also the single seam through
 * which every feature reaches the database.
 *
 * In demo mode (the app booted under /demo) it returns an in-memory fake
 * instead: the real client is never created, so no session, cookie or request
 * can leave the page, and `onDbClientCreated` callbacks (auth listeners for
 * real sessions) are never run.
 */
export function useDb(): DbClient {
  if (isDemoMode()) return getFakeClient()

  if (!client) {
    client = createDbClient()
    const callbacks = pendingCallbacks
    pendingCallbacks = []
    callbacks.forEach((callback) => callback(client!))
  }
  return client
}

/**
 * Runs `callback` once with the client: right away if it already exists,
 * otherwise as soon as it is created. Lets higher layers (e.g. auth listeners)
 * hook into the client without forcing its creation or being imported by `shared`.
 */
export function onDbClientCreated(callback: (client: DbClient) => void): void {
  if (client) {
    callback(client)
    return
  }
  pendingCallbacks.push(callback)
}

/** Test-only: forgets the singleton and pending callbacks. */
export function __resetDbClientForTests(): void {
  client = null
  pendingCallbacks = []
  __resetFakeClientForTests()
}
