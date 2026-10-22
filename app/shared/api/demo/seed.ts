import type { User } from '@supabase/supabase-js'
import type { Database } from '../supabase/types/database'

type Tables = Database['public']['Tables']

export type DemoSeed = {
  [Table in 'calendar_events' | 'google_accounts' | 'notes' | 'settings']: Array<Tables[Table]['Row']>
}

export const DEMO_USER_ID = '00000000-0000-4000-8000-00000000d3a0'

/** The only identity in demo mode: what pages and middleware see as the signed-in user. */
export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: 'demo@planify.app',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { first_name: 'Demo', last_name: 'User' },
  created_at: '2026-01-01T00:00:00.000Z',
}

/** Stable, valid UUIDs: `kind` is a hex digit that namespaces the table, so ids never collide. */
const seedId = (kind: 'c' | 'e' | 'a', n: number) => `00000000-0000-4000-8000-${kind}${String(n).padStart(11, '0')}`

const ACCOUNT_IDS = {
  acme: seedId('c', 1),
  studio: seedId('c', 2),
  personal: seedId('c', 3),
} as const

/** Same shape the settings page stores; mirrors the preset colours of the real app. */
const color = (colorName: string, [r, g, b]: [number, number, number]) => ({
  colorName,
  lightColors: {
    main: `rgb(${r}, ${g}, ${b})`,
    container: `rgba(${r}, ${g}, ${b}, 0.2)`,
    onContainer: `rgb(${r}, ${g}, ${b})`,
  },
})

type EventSpec = {
  key: string
  title: string
  /** 0 = Monday ... 4 = Friday */
  day: number
  start: [hour: number, minute: number]
  end: [hour: number, minute: number]
  account: keyof typeof ACCOUNT_IDS | null
  location?: string
  description?: string
}

const EVENT_SPECS: EventSpec[] = [
  { key: 'standup-mon', title: 'Acme standup', day: 0, start: [9, 0], end: [9, 30], account: 'acme', description: 'Daily sync with the Acme product team.' },
  { key: 'deep-work-mon', title: 'Deep work', day: 0, start: [10, 0], end: [12, 30], account: null, description: 'No meetings. Roadmap draft.' },
  { key: 'studio-review', title: 'Studio review', day: 0, start: [14, 0], end: [15, 0], account: 'studio', location: 'Zoom' },
  { key: 'standup-tue', title: 'Acme standup', day: 1, start: [9, 0], end: [9, 30], account: 'acme' },
  { key: 'client-call', title: 'Client call', day: 1, start: [11, 0], end: [12, 0], account: 'acme', location: 'Google Meet', description: 'Walk through the Q4 scope and open questions.' },
  { key: 'design-sync', title: 'Design sync', day: 1, start: [11, 30], end: [12, 30], account: 'studio' },
  { key: 'dentist', title: 'Dentist', day: 1, start: [16, 0], end: [17, 0], account: 'personal', location: 'Smile Clinic' },
  { key: 'standup-wed', title: 'Acme standup', day: 2, start: [9, 0], end: [9, 30], account: 'acme' },
  { key: 'deep-work-wed', title: 'Deep work', day: 2, start: [13, 0], end: [16, 0], account: null },
  { key: 'planning', title: 'Sprint planning', day: 3, start: [10, 0], end: [11, 30], account: 'acme', location: 'Office, room 2' },
  { key: 'lunch', title: 'Lunch with Sam', day: 3, start: [12, 30], end: [13, 30], account: 'personal' },
  { key: 'prep', title: 'Prepare demo for Studio', day: 3, start: [15, 0], end: [16, 0], account: null, description: 'Slides and a click-through of the new flow.' },
  { key: 'standup-fri', title: 'Acme standup', day: 4, start: [9, 0], end: [9, 30], account: 'acme' },
  { key: 'studio-demo', title: 'Studio demo', day: 4, start: [11, 0], end: [12, 0], account: 'studio', location: 'Zoom' },
  { key: 'retro', title: 'Weekly retro', day: 4, start: [16, 0], end: [17, 0], account: null },
]

/** Monday 00:00 (local time) of the week containing `date`. */
function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

const eventId = (key: string) => seedId('e', EVENT_SPECS.findIndex((spec) => spec.key === key) + 1)

/**
 * Builds the demo workspace relative to `now`: the events always land in the
 * current Monday to Friday, so the calendar and dashboard never look stale.
 * Rows are typed with the generated schema, so a schema change breaks the build
 * here instead of silently drifting from the real backend.
 */
export function createSeed(now: Date): DemoSeed {
  const monday = startOfWeek(now)
  const stamp = now.toISOString()

  const at = (day: number, [hour, minute]: [number, number]) =>
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + day, hour, minute).toISOString()

  const google_accounts: DemoSeed['google_accounts'] = [
    { email: 'alex@acme.com', name: 'Alex Morgan (Acme)', id: ACCOUNT_IDS.acme, googleUserId: 'g-acme' },
    { email: 'alex@studio.io', name: 'Alex Morgan (Studio)', id: ACCOUNT_IDS.studio, googleUserId: 'g-studio' },
    { email: 'alex.morgan@gmail.com', name: 'Alex Morgan', id: ACCOUNT_IDS.personal, googleUserId: 'g-personal' },
  ].map(({ email, name, id, googleUserId }, index) => ({
    id,
    user_id: DEMO_USER_ID,
    google_user_id: googleUserId,
    email,
    display_name: name,
    picture_url: null,
    // Placeholders: the demo never talks to Google, and the app never selects these columns.
    access_token: 'demo-not-a-token',
    refresh_token: 'demo-not-a-token',
    expires_at: '2099-01-01T00:00:00.000Z',
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    is_active: true,
    created_at: new Date(now.getTime() - (3 - index) * 86_400_000).toISOString(),
    updated_at: stamp,
  }))

  const calendar_events: DemoSeed['calendar_events'] = EVENT_SPECS.map((spec) => ({
    id: eventId(spec.key),
    user_id: DEMO_USER_ID,
    google_account_id: spec.account ? ACCOUNT_IDS[spec.account] : null,
    is_internal: spec.account === null,
    calendar_id: null,
    external_event_id: null,
    title: spec.title,
    description: spec.description ?? null,
    location: spec.location ?? null,
    start_at: at(spec.day, spec.start),
    end_at: at(spec.day, spec.end),
    all_day: false,
    status: 'confirmed',
    creator_email: null,
    organizer_email: null,
    html_link: null,
    etag: null,
    updated_at_google: null,
    synced_at: stamp,
  }))

  const note = (
    index: number,
    title: string,
    text: string,
    linkedEventKey: string | null,
    ageDays: number,
  ): DemoSeed['notes'][number] => {
    const when = new Date(now.getTime() - ageDays * 86_400_000).toISOString()
    return {
      id: seedId('a', index),
      user_id: DEMO_USER_ID,
      calendar_event_id: linkedEventKey ? eventId(linkedEventKey) : null,
      title,
      content: `<p>${text}</p>`,
      content_text: text,
      created_at: when,
      updated_at: when,
    }
  }

  const notes: DemoSeed['notes'] = [
    note(1, 'Client call: Q4 scope', 'Agreed to ship the reporting export first. Follow up on the budget by Friday.', 'client-call', 1),
    note(2, 'Sprint planning decisions', 'Pick up the calendar sync bug, defer the mobile layout. Capacity is 18 points.', 'planning', 2),
    note(3, 'Studio demo checklist', 'Slides, click-through, fallback screenshots. Ask for feedback on onboarding.', 'studio-demo', 0),
    note(4, 'Product ideas', 'Weekly digest email, quick capture shortcut, tags for notes.', null, 4),
    note(5, 'Reading list', 'Shape Up, The Mom Test, a talk on calendar UX.', null, 6),
    note(6, 'Groceries', 'Coffee, oat milk, bananas, pasta.', null, 3),
    note(7, 'Acme standup notes', 'Blocked on API access, Alex shares credentials today. Demo moves to Thursday.', 'standup-mon', 0),
  ]

  const settings: DemoSeed['settings'] = [
    {
      user_id: DEMO_USER_ID,
      created_at: stamp,
      updated_at: stamp,
      preferences: {
        eventsColors: {
          internal: color('personal', [120, 120, 120]),
          [ACCOUNT_IDS.acme]: color('blue', [0, 110, 255]),
          [ACCOUNT_IDS.studio]: color('green', [0, 180, 0]),
          [ACCOUNT_IDS.personal]: color('red', [255, 0, 0]),
        },
      },
    },
  ]

  return { google_accounts, calendar_events, notes, settings }
}
