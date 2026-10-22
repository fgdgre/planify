import { FunctionsHttpError } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/types/database'
import { FakeQueryBuilder, type FakeTable } from './fake-query'
import { createSeed, DEMO_USER, DEMO_USER_ID, type DemoSeed } from './seed'

type DbClient = SupabaseClient<Database>
type Tables = Database['public']['Tables']

const NOT_AVAILABLE = { message: 'Not available in the demo' }

const newId = () => crypto.randomUUID()

/**
 * Per-table knowledge the real database has: primary key and column defaults.
 * Typed against the generated rows, so a new required column fails the build.
 */
function createTables(seed: DemoSeed): Record<string, FakeTable> {
  const now = () => new Date().toISOString()

  const tables: Record<string, FakeTable> = {
    calendar_events: {
      primaryKey: 'id',
      rows: seed.calendar_events,
      defaults: () =>
        ({
          id: newId(),
          user_id: DEMO_USER_ID,
          google_account_id: null,
          is_internal: false,
          calendar_id: null,
          external_event_id: null,
          title: null,
          description: null,
          location: null,
          all_day: false,
          status: 'confirmed',
          creator_email: null,
          organizer_email: null,
          html_link: null,
          etag: null,
          updated_at_google: null,
          synced_at: now(),
        }) satisfies Omit<Tables['calendar_events']['Row'], 'start_at' | 'end_at'>,
      // notes.calendar_event_id: a deleted event leaves its notes behind, unlinked.
      onDelete: (removed) => {
        const ids = removed.map((event) => event.id)
        tables.notes!.rows.forEach((note) => {
          if (ids.includes(note.calendar_event_id)) note.calendar_event_id = null
        })
      },
    },
    notes: {
      primaryKey: 'id',
      rows: seed.notes,
      defaults: () =>
        ({
          id: newId(),
          user_id: DEMO_USER_ID,
          calendar_event_id: null,
          content: '',
          content_text: null,
          created_at: now(),
          updated_at: now(),
        }) satisfies Omit<Tables['notes']['Row'], 'title'>,
    },
    settings: {
      primaryKey: 'user_id',
      rows: seed.settings,
      defaults: () =>
        ({
          user_id: DEMO_USER_ID,
          created_at: now(),
          updated_at: now(),
        }) satisfies Omit<Tables['settings']['Row'], 'preferences'>,
    },
    google_accounts: {
      primaryKey: 'id',
      rows: seed.google_accounts,
      defaults: () =>
        ({
          id: newId(),
          user_id: DEMO_USER_ID,
          display_name: null,
          picture_url: null,
          is_active: true,
          scopes: [],
          created_at: now(),
          updated_at: now(),
        }) satisfies Omit<Tables['google_accounts']['Row'], 'access_token' | 'refresh_token' | 'email' | 'expires_at' | 'google_user_id'>,
      // calendar_events.google_account_id: a removed account takes its events with it.
      onDelete: (removed) => {
        const events = tables.calendar_events!
        const ids = removed.map((account) => account.id)
        const gone = events.rows.filter((event) => ids.includes(event.google_account_id))
        events.rows = events.rows.filter((event) => !gone.includes(event))
        events.onDelete?.(gone)
      },
    },
  }

  return tables
}

const unavailable = async () => ({ data: { user: null, session: null }, error: NOT_AVAILABLE })

function createFakeAuth() {
  const session = {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: DEMO_USER,
  }

  return {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user: DEMO_USER }, error: null }),
    // The demo user never signs in or out, so there is nothing to emit.
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: NOT_AVAILABLE }),
    updateUser: unavailable,
    signInWithPassword: unavailable,
    signUp: unavailable,
    signInWithOAuth: unavailable,
    resetPasswordForEmail: async () => ({ data: null, error: NOT_AVAILABLE }),
  }
}

/** Fails the way a deployed function does, so callers need no demo-specific branch. */
const demoUnavailableError = () =>
  new FunctionsHttpError(
    new Response(JSON.stringify({ error: 'demo_unavailable' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }),
  )

function createFakeFunctions() {
  return {
    /** Accepts `name?query` since the real invoke has no query option; the query is irrelevant here. */
    invoke: async (nameWithQuery: string) => {
      const name = nameWithQuery.split('?')[0]

      if (name === 'google-list-calendars' || name === 'google-sync-events') {
        return { data: { ok: true }, error: null }
      }

      return { data: null, error: demoUnavailableError() }
    },
  }
}

/**
 * An in-memory Supabase client for the public demo. It implements only what
 * the app calls (see the fake query builder) and keeps all data in the page, so
 * nothing reaches the network and nothing persists beyond a reload.
 */
export function createFakeClient(seed: DemoSeed = createSeed(new Date())): DbClient {
  const tables = createTables(seed)

  const client = {
    from(name: string) {
      const table = tables[name]
      if (!table) throw new Error(`Fake database: unknown table "${name}"`)
      return new FakeQueryBuilder(table)
    },
    auth: createFakeAuth(),
    functions: createFakeFunctions(),
  }

  // The fake covers a strict subset of the client API; this is the one place that claims otherwise.
  return client as unknown as DbClient
}

let singleton: DbClient | null = null

/** The session-wide fake client: one workspace shared by every composable, like the real singleton. */
export function getFakeClient(): DbClient {
  singleton ??= createFakeClient()
  return singleton
}

/** Test-only: drops the singleton so the next call reseeds. */
export function __resetFakeClientForTests(): void {
  singleton = null
}
