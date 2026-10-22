import { describe, expect, it, vi } from 'vitest'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { createFakeClient, createSeed, DEMO_USER, DEMO_USER_ID } from '@shared/api/demo'
import { GOOGLE_ACCOUNT_SELECT } from '@shared/constants/google-accounts'

const NOT_AVAILABLE = 'Not available in the demo'

describe('fake auth', () => {
  const db = createFakeClient(createSeed(new Date('2026-10-22T10:00:00Z')))

  it('exposes a fixed demo user', () => {
    expect(DEMO_USER.id).toBe(DEMO_USER_ID)
    expect(DEMO_USER.email).toBe('demo@planify.app')
  })

  it('getSession and getUser return the demo user', async () => {
    const session = await db.auth.getSession()
    expect(session.error).toBeNull()
    expect(session.data.session?.user).toEqual(DEMO_USER)

    const user = await db.auth.getUser()
    expect(user.data.user).toEqual(DEMO_USER)
    expect(user.error).toBeNull()
  })

  it('onAuthStateChange returns a subscription and never emits', () => {
    const callback = vi.fn()
    const { data } = db.auth.onAuthStateChange(callback)

    expect(() => data.subscription.unsubscribe()).not.toThrow()
    expect(callback).not.toHaveBeenCalled()
  })

  it.each([
    ['signOut', () => db.auth.signOut()],
    ['updateUser', () => db.auth.updateUser({ password: 'x' })],
    ['signInWithPassword', () => db.auth.signInWithPassword({ email: 'a@b.c', password: 'x' })],
    ['signUp', () => db.auth.signUp({ email: 'a@b.c', password: 'x' })],
    ['signInWithOAuth', () => db.auth.signInWithOAuth({ provider: 'google' })],
    ['resetPasswordForEmail', () => db.auth.resetPasswordForEmail('a@b.c')],
  ])('%s resolves with a "not available" error', async (_name, call) => {
    const result = await call()
    expect(result.error?.message).toBe(NOT_AVAILABLE)
  })
})

describe('fake functions.invoke', () => {
  const db = createFakeClient(createSeed(new Date('2026-10-22T10:00:00Z')))

  it.each(['google-list-calendars', 'google-sync-events'])('%s succeeds without doing anything', async (name) => {
    const result = await db.functions.invoke(name, { body: { googleAccountId: 'x' } })
    expect(result).toMatchObject({ data: { ok: true }, error: null })
  })

  it.each(['google-oauth-start', 'google-oauth-complete'])('%s fails with demo_unavailable like a server error', async (name) => {
    const { data, error } = await db.functions.invoke(name, { method: 'GET' })

    expect(data).toBeNull()
    expect(error).toBeInstanceOf(FunctionsHttpError)
    const response = (error as FunctionsHttpError).context as Response
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'demo_unavailable' })
  })

  it('ignores a query string on the function name', async () => {
    const { error } = await db.functions.invoke('google-oauth-start?app_origin=https%3A%2F%2Fx.test', { method: 'GET' })
    expect(error).toBeInstanceOf(FunctionsHttpError)
  })
})

describe('seed', () => {
  const now = new Date('2026-10-22T10:00:00') // a Thursday, local time
  const seed = createSeed(now)

  it('has three Google accounts on the expected domains', () => {
    expect(seed.google_accounts.map((a) => a.email.split('@')[1])).toEqual(['acme.com', 'studio.io', 'gmail.com'])
    expect(seed.google_accounts.every((a) => a.user_id === DEMO_USER_ID)).toBe(true)
  })

  it('puts about fifteen events inside Monday to Friday of the current week, 9:00-17:00', () => {
    expect(seed.calendar_events.length).toBeGreaterThanOrEqual(14)
    expect(seed.calendar_events.length).toBeLessThanOrEqual(17)

    for (const event of seed.calendar_events) {
      const start = new Date(event.start_at)
      const end = new Date(event.end_at)
      expect(start.getFullYear()).toBe(2026)
      expect(start.getMonth()).toBe(9)
      expect(start.getDate()).toBeGreaterThanOrEqual(19) // Mon 19th
      expect(start.getDate()).toBeLessThanOrEqual(23) // Fri 23rd
      expect(start.getHours()).toBeGreaterThanOrEqual(9)
      expect(end.getHours() + end.getMinutes() / 60).toBeLessThanOrEqual(17)
      expect(end.getTime()).toBeGreaterThan(start.getTime())
    }
  })

  it('mixes Google and internal events and contains an overlap', () => {
    const accountIds = new Set(seed.google_accounts.map((a) => a.id))
    const internal = seed.calendar_events.filter((e) => e.is_internal)
    const google = seed.calendar_events.filter((e) => !e.is_internal)

    expect(internal.length).toBeGreaterThan(0)
    expect(google.every((e) => e.google_account_id && accountIds.has(e.google_account_id))).toBe(true)
    expect(new Set(google.map((e) => e.google_account_id)).size).toBe(3)
    expect(internal.every((e) => e.google_account_id === null)).toBe(true)

    const sorted = [...seed.calendar_events].sort((a, b) => a.start_at.localeCompare(b.start_at))
    const overlaps = sorted.filter((e, i) => i > 0 && e.start_at < sorted[i - 1]!.end_at && e.start_at.slice(0, 10) === sorted[i - 1]!.start_at.slice(0, 10))
    expect(overlaps.length).toBeGreaterThanOrEqual(1)
  })

  it('has about six notes, some linked to seeded events and some free', () => {
    const eventIds = new Set(seed.calendar_events.map((e) => e.id))
    expect(seed.notes).toHaveLength(7)
    expect(seed.notes.filter((n) => n.calendar_event_id).every((n) => eventIds.has(n.calendar_event_id!))).toBe(true)
    expect(seed.notes.some((n) => n.calendar_event_id)).toBe(true)
    expect(seed.notes.some((n) => !n.calendar_event_id)).toBe(true)
    expect(seed.notes.every((n) => n.content_text)).toBe(true)
  })

  it('has a settings row with a colour for every account and for internal events', () => {
    const [settings] = seed.settings
    const colors = (settings!.preferences as { eventsColors: Record<string, { lightColors: { main: string } }> }).eventsColors

    expect(Object.keys(colors).sort()).toEqual(['internal', ...seed.google_accounts.map((a) => a.id)].sort())
    expect(settings!.user_id).toBe(DEMO_USER_ID)
  })

  it('serves the public google account columns through the fake client', async () => {
    const db = createFakeClient(seed)
    const { data } = await db.from('google_accounts').select(GOOGLE_ACCOUNT_SELECT).order('created_at', { ascending: false })

    expect(data).toHaveLength(3)
    expect(data![0]).not.toHaveProperty('access_token')
    expect(data![0]).not.toHaveProperty('refresh_token')
  })

  it('anchors events to the week of the given date even on a Sunday', () => {
    const sunday = createSeed(new Date('2026-10-25T12:00:00'))
    const days = new Set(sunday.calendar_events.map((e) => new Date(e.start_at).getDate()))
    expect(Math.min(...days)).toBe(19)
    expect(Math.max(...days)).toBe(23)
  })
})
