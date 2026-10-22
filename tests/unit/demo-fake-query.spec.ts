import { beforeEach, describe, expect, it } from 'vitest'
import { createFakeClient } from '@shared/api/demo/fake-client'
import type { DemoSeed } from '@shared/api/demo/seed'
import { DEMO_USER_ID } from '@shared/api/demo/seed'

type NoteRow = DemoSeed['notes'][number]

const note = (overrides: Partial<NoteRow> & Pick<NoteRow, 'id' | 'title'>): NoteRow => ({
  calendar_event_id: null,
  content: '',
  content_text: null,
  created_at: '2026-10-01T10:00:00.000Z',
  updated_at: '2026-10-01T10:00:00.000Z',
  user_id: DEMO_USER_ID,
  ...overrides,
})

const fixtureNotes = (): NoteRow[] => [
  note({ id: 'n1', title: 'Alpha plan', content_text: 'roadmap for Q4', calendar_event_id: 'e1', created_at: '2026-10-01T10:00:00.000Z' }),
  note({ id: 'n2', title: 'Beta notes', content_text: 'Alpha mentions here', created_at: '2026-10-02T10:00:00.000Z' }),
  note({ id: 'n3', title: 'Gamma', content_text: null, calendar_event_id: 'e2', created_at: '2026-10-03T10:00:00.000Z' }),
  note({ id: 'n4', title: 'Other user', user_id: 'someone-else', created_at: '2026-10-04T10:00:00.000Z' }),
]

const makeClient = () =>
  createFakeClient({ calendar_events: [], google_accounts: [], settings: [], notes: fixtureNotes() })

describe('fake query builder: reading', () => {
  let db: ReturnType<typeof makeClient>
  beforeEach(() => {
    db = makeClient()
  })

  it('returns every row for select(*) as { data, error: null }', async () => {
    const { data, error } = await db.from('notes').select('*')
    expect(error).toBeNull()
    expect(data).toHaveLength(4)
  })

  it('composes filters with AND', async () => {
    const { data } = await db.from('notes').select('*').eq('user_id', DEMO_USER_ID).eq('title', 'Gamma')
    expect(data?.map((r) => r.id)).toEqual(['n3'])
  })

  it('supports in, gte and lte', async () => {
    const byIn = await db.from('notes').select('*').in('id', ['n1', 'n3'])
    expect(byIn.data?.map((r) => r.id)).toEqual(['n1', 'n3'])

    const byRange = await db
      .from('notes')
      .select('*')
      .gte('created_at', '2026-10-02T00:00:00.000Z')
      .lte('created_at', '2026-10-03T23:59:59.000Z')
    expect(byRange.data?.map((r) => r.id)).toEqual(['n2', 'n3'])
  })

  it('compares timestamps by instant, not by text', async () => {
    const { data } = await db.from('notes').select('*').gte('created_at', '2026-10-03T12:00:00+02:00')
    expect(data?.map((r) => r.id)).toEqual(['n3', 'n4'])
  })

  it('supports is(col, null) and not(col, "is", null)', async () => {
    const unlinked = await db.from('notes').select('*').is('calendar_event_id', null)
    expect(unlinked.data?.map((r) => r.id)).toEqual(['n2', 'n4'])

    const linked = await db.from('notes').select('*').not('calendar_event_id', 'is', null)
    expect(linked.data?.map((r) => r.id)).toEqual(['n1', 'n3'])
  })

  it('or() with ilike matches case-insensitively with % wildcards across columns', async () => {
    const { data } = await db.from('notes').select('*').or('title.ilike.%ALPHA%,content_text.ilike.%alpha%')
    expect(data?.map((r) => r.id)).toEqual(['n1', 'n2'])
  })

  it('ilike without wildcards must match the whole value', async () => {
    const { data } = await db.from('notes').select('*').or('title.ilike.gamma,title.ilike.bet')
    expect(data?.map((r) => r.id)).toEqual(['n3'])
  })

  it('keeps a comma inside the search term', async () => {
    const { data } = await db.from('notes').select('*').or('title.ilike.%a, b%,content_text.ilike.%a, b%')
    expect(data).toEqual([])
  })

  it('orders ascending and descending, nulls last when ascending', async () => {
    const desc = await db.from('notes').select('*').order('created_at', { ascending: false })
    expect(desc.data?.map((r) => r.id)).toEqual(['n4', 'n3', 'n2', 'n1'])

    const asc = await db.from('notes').select('*').order('content_text', { ascending: true })
    expect(asc.data?.map((r) => r.id).at(-1)).toBeDefined()
    expect(asc.data?.slice(-2).map((r) => r.content_text)).toEqual([null, null])
  })

  it('range(from, to) is inclusive and count exact ignores the range', async () => {
    const { data, count } = await db
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', DEMO_USER_ID)
      .order('created_at', { ascending: true })
      .range(1, 2)

    expect(data?.map((r) => r.id)).toEqual(['n2', 'n3'])
    expect(count).toBe(3)
  })

  it('projects a column list', async () => {
    const { data } = await db.from('notes').select('title, id').eq('id', 'n1').single()
    expect(data).toEqual({ title: 'Alpha plan', id: 'n1' })
  })

  it('single() returns the row, and errors with PGRST116 on 0 or many rows', async () => {
    const one = await db.from('notes').select('*').eq('id', 'n1').single()
    expect(one.error).toBeNull()
    expect(one.data?.id).toBe('n1')

    const none = await db.from('notes').select('*').eq('id', 'missing').single()
    expect(none.data).toBeNull()
    expect(none.error?.code).toBe('PGRST116')

    const many = await db.from('notes').select('*').single()
    expect(many.error?.code).toBe('PGRST116')
  })

  it('maybeSingle() returns null for 0 rows and errors for many', async () => {
    const none = await db.from('notes').select('*').eq('id', 'missing').maybeSingle()
    expect(none).toMatchObject({ data: null, error: null })

    const many = await db.from('notes').select('*').maybeSingle()
    expect(many.error?.code).toBe('PGRST116')
  })

  it('hands out copies so callers cannot mutate the store', async () => {
    const first = await db.from('notes').select('*').eq('id', 'n1').single()
    first.data!.title = 'mutated'

    const second = await db.from('notes').select('*').eq('id', 'n1').single()
    expect(second.data?.title).toBe('Alpha plan')
  })

  it('returns an error for an unknown table', () => {
    expect(() => (db as any).from('nope')).toThrow(/nope/)
  })
})

describe('fake query builder: writing', () => {
  let db: ReturnType<typeof makeClient>
  beforeEach(() => {
    db = makeClient()
  })

  it('insert().select().single() assigns id, timestamps and the demo user', async () => {
    const { data, error } = await db.from('notes').insert({ title: 'Fresh' } as never).select().single()

    expect(error).toBeNull()
    expect(data?.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(data?.user_id).toBe(DEMO_USER_ID)
    expect(Date.parse(data!.created_at)).not.toBeNaN()
    expect(Date.parse(data!.updated_at)).not.toBeNaN()
    expect(data?.calendar_event_id).toBeNull()
    expect(data?.content).toBe('')

    const { data: all } = await db.from('notes').select('*')
    expect(all).toHaveLength(5)
  })

  it('insert keeps a provided user_id and accepts several rows', async () => {
    const { data } = await db
      .from('notes')
      .insert([{ title: 'a', user_id: 'x' }, { title: 'b' }] as never)
      .select()

    expect(data?.map((r) => r.user_id)).toEqual(['x', DEMO_USER_ID])
  })

  it('insert without select() resolves with null data', async () => {
    const result = await db.from('notes').insert({ title: 'quiet' } as never)
    expect(result).toMatchObject({ data: null, error: null })
  })

  it('calendar_events inserts get event defaults', async () => {
    const { data } = await db
      .from('calendar_events')
      .insert({ title: 'Mine', start_at: '2026-10-22T09:00:00.000Z', end_at: '2026-10-22T10:00:00.000Z', is_internal: true } as never)
      .select()
      .single()

    expect(data).toMatchObject({ user_id: DEMO_USER_ID, all_day: false, status: 'confirmed', google_account_id: null })
    expect(data?.id).toBeTruthy()
  })

  it('update(patch).eq() changes only matching rows and returns them with select()', async () => {
    const { data, error } = await db.from('notes').update({ title: 'Renamed' }).eq('id', 'n2').select().single()

    expect(error).toBeNull()
    expect(data).toMatchObject({ id: 'n2', title: 'Renamed', content_text: 'Alpha mentions here' })

    const { data: untouched } = await db.from('notes').select('title').eq('id', 'n1').single()
    expect(untouched?.title).toBe('Alpha plan')
  })

  it('update matching nothing makes single() fail like PostgREST', async () => {
    const { error } = await db.from('notes').update({ title: 'x' }).eq('id', 'missing').select().single()
    expect(error?.code).toBe('PGRST116')
  })

  it('delete().eq() removes only matching rows', async () => {
    const { error } = await db.from('notes').delete().eq('id', 'n1')
    expect(error).toBeNull()

    const { data } = await db.from('notes').select('id')
    expect(data?.map((r) => r.id)).toEqual(['n2', 'n3', 'n4'])
  })

  it('upsert inserts when the conflict key is new and merges when it exists', async () => {
    const inserted = await db.from('settings').upsert({ user_id: DEMO_USER_ID, preferences: { a: 1 } }).select().single()
    expect(inserted.data?.preferences).toEqual({ a: 1 })

    await db.from('settings').upsert({ user_id: DEMO_USER_ID, preferences: { a: 2 } })
    const { data } = await db.from('settings').select('*')
    expect(data).toHaveLength(1)
    expect(data?.[0]?.preferences).toEqual({ a: 2 })
  })

  it('upsert honours onConflict', async () => {
    await db.from('notes').upsert({ id: 'n1', title: 'Via id' } as never, { onConflict: 'id' })
    const { data } = await db.from('notes').select('title').eq('id', 'n1').single()
    expect(data?.title).toBe('Via id')
    expect((await db.from('notes').select('*')).data).toHaveLength(4)
  })

  it('does not store the caller object by reference', async () => {
    const payload = { title: 'ref', content: 'c' }
    const { data } = await db.from('notes').insert(payload as never).select().single()
    payload.title = 'changed'

    const { data: stored } = await db.from('notes').select('title').eq('id', data!.id).single()
    expect(stored?.title).toBe('ref')
  })
})

describe('fake database: foreign keys', () => {
  const event = (id: string, google_account_id: string | null) => ({ id, google_account_id, start_at: '2026-10-22T09:00:00Z', end_at: '2026-10-22T10:00:00Z' })

  const makeLinkedClient = () =>
    createFakeClient({
      calendar_events: [event('e1', 'a1'), event('e2', 'a2'), event('e3', null)] as never,
      google_accounts: [{ id: 'a1' }, { id: 'a2' }] as never,
      settings: [],
      notes: [
        note({ id: 'n1', title: 'on e1', calendar_event_id: 'e1' }),
        note({ id: 'n2', title: 'on e2', calendar_event_id: 'e2' }),
        note({ id: 'n3', title: 'free' }),
      ],
    })

  it('deleting an event unlinks its notes but keeps them', async () => {
    const db = makeLinkedClient()
    await db.from('calendar_events').delete().eq('id', 'e1')

    const { data } = await db.from('notes').select('id, calendar_event_id').order('id')
    expect(data).toEqual([
      { id: 'n1', calendar_event_id: null },
      { id: 'n2', calendar_event_id: 'e2' },
      { id: 'n3', calendar_event_id: null },
    ])
  })

  it('deleting an account removes its events and unlinks their notes', async () => {
    const db = makeLinkedClient()
    await db.from('google_accounts').delete().eq('id', 'a1')

    const { data: events } = await db.from('calendar_events').select('id').order('id')
    expect(events).toEqual([{ id: 'e2' }, { id: 'e3' }])

    const { data: notes } = await db.from('notes').select('id, calendar_event_id').eq('id', 'n1').single()
    expect(notes?.calendar_event_id).toBeNull()
  })
})
