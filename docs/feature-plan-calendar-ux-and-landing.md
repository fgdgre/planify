# Feature Plan: Detached Events, Sidebar Notes, Calendar Density, Landing Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended)
> or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.
>
> Status: PLAN (not started). Written 2026-08-12.
> Personal doc — `docs/` is intentionally untracked, same as the other files here.
> Companion to `docs/feature-plan-telegram-notifications-mobile.md` (that one is the
> notification-center / bot / mobile track; this one is the calendar-UX + public-face track).
> These four are independent of each other and independent of the Telegram track —
> they can be done in any order, or interleaved as filler between the bigger milestones.

**Goal:** Four self-contained improvements — (1) surface external events that were deleted
upstream instead of silently lying about them, (2) let notes be attached to external events
from the event sidebar, (3) make the week grid fit a desktop screen and open at 07:00,
(4) replace the placeholder landing page with a real one.

**Architecture:** Milestone 1 adds a "detached" lifecycle state to `calendar_events`, detected
in the existing `google-sync-events` edge function via a `synced_at` watermark sweep, and rendered
via Schedule-X `_options.additionalClasses`. Milestone 2 is almost pure UI — the note-persistence
plumbing for view-mode already exists in `useEventSidebar`. Milestone 3 fixes a dead-config bug and
adds the `@schedule-x/scroll-controller` plugin. Milestone 4 is a new `landing` feature slice
plus one SSR decision.

**Tech Stack:** Nuxt 4 (SPA, `ssr: false`), Vue 3.5, Pinia, Tailwind 4, Schedule-X 3.7.3,
Supabase (Postgres + Deno edge functions), Zod 4, Vitest + Playwright.

---

## Global Constraints

- **FSD layers**: `shared → entities → features`. There is no `widgets` layer. Run the
  `fsd-place` skill before creating any new file under `app/`. Imports may only point
  "down" a layer, never up or sideways between feature slices.
- **Schedule-X version pinning**: `@schedule-x/calendar` and `@schedule-x/theme-default` are
  `^3.7.3`; the plugins (`current-time`, `drag-and-drop`, `resize`) are pinned **exactly** at
  `3.7.3`. Any new Schedule-X plugin must be pinned exactly at `3.7.3`. Do **not** bump to 4.x
  in this plan — v4 is a separate migration with its own breaking changes.
- **No migrations directory exists.** `supabase/` contains only `config.toml` and `functions/`.
  Schema changes are run by hand in the Supabase SQL editor, then types are regenerated with
  `pnpm db:types` (writes `app/shared/api/supabase/types/database.ts`). Every SQL block in this
  plan is written to be run as-is and to be idempotent (`if not exists`).
- **Deploys**: Netlify auto-builds are disabled (`netlify.toml` → `ignore = "exit 0"`). Deploy
  happens from GitHub Actions after `typecheck + unit + e2e` pass on `main`. So a red typecheck
  blocks the deploy — never commit with a red `pnpm typecheck`.
- **Verification command for every task**: `pnpm typecheck && pnpm test`. Edge-function changes
  have no test harness (Deno, not covered by Vitest) — they are verified manually, see Task 1.3.
- **Commit style**: short lowercase imperative, matching history (`ui fixes on login\signup pages`,
  `add sign in with google option`).

---

## Grounding facts (verified in the codebase, 2026-08-12)

Read this section before touching anything. Two of these are pre-existing bugs that the
milestones below depend on.

### The sync loses deletions silently

`supabase/functions/google-sync-events/index.ts` fetches with `singleEvents: 'true'` and **no
`showDeleted`**, over a fixed window of `[now - 30d, now + 90d]`, then `upsert`s on
`(google_account_id, calendar_id, external_event_id)`. There is no delete pass and no
`syncToken`. Consequence: when an event is deleted in Google Calendar it simply stops appearing
in the API response, the upsert never touches the stale row, and **the row lives in
`calendar_events` forever and keeps rendering in the calendar as if it were real.** That is the
bug Milestone 1 fixes.

### `dayBoundaries` is dead config (pre-existing bug)

`app/entities/calendar/composables/useCalendarApp.ts:86-109` — `buildCalendarsConfig()` builds an
object that starts with `dayBoundaries` and `weekOptions` keys, and that whole object is passed to
`createCalendar` as **`calendars:`** (line 113). Schedule-X expects `calendars` to be a map of
`calendarId → { colorName, lightColors, ... }`. So Schedule-X is currently being told there is a
calendar *named* `dayBoundaries` and a calendar *named* `weekOptions`, and the real
`dayBoundaries` setting is never applied. The `weekOptions: { eventWidth: 95 }` at line 116 *is*
applied because it is correctly top-level; the nested duplicate is not. Milestone 3 fixes this.

### `calendar_events` already has a `status` column

Columns (from `app/shared/api/supabase/types/database.ts:17-97`): `id`, `user_id`, `google_account_id`,
`calendar_id`, `external_event_id`, `title`, `description`, `location`, `start_at`, `end_at`,
`all_day`, `is_internal`, `status` (`text`, NOT NULL), `organizer_email`, `creator_email`,
`html_link`, `etag`, `updated_at_google`, `synced_at`.

`status` is written straight from Google (`event.status ?? 'confirmed'`), so it already carries
Google's own vocabulary: `confirmed | tentative | cancelled`. Milestone 1 reuses `cancelled` for
the detached state — semantically exact and **zero schema change needed for the state itself**.
Only the human-facing timestamp (`detached_at`) is new.

### There are two byte-identical row→display mappers

- `app/entities/calendar/helpers/index.ts:34` → `mapCalendarEventRowToDisplay(event: CalendarEventRow)`
- `app/entities/calendar/composables/calendar.ts:8` → `mapEventToDisplay(event: CalendarEvent)`

`CalendarEvent` (in `app/features/integrations/google-calendar/types/google-calendar.ts`) is
literally `Database['public']['Tables']['calendar_events']['Row']` — the same type under a
different name. The two functions have identical bodies. Any new display field has to be added in
both places or the calendar and the sidebar will disagree. Task 1.4 unifies them first, so the
rest of the milestone only edits one function.

### View-mode note plumbing already exists — only the button is missing

In `app/entities/calendar/composables/event-sidebar.ts`:
- `handleSubmit()` has a dedicated `activeMode === 'view'` branch (line 497) that calls
  `persistNoteForEvent(selectedEvent.id)` and re-fetches — it does **not** require the event to be internal.
- `openNotePanel()` (line 371), `submitLabel` returns `'Save note'` for view+note-panel (line 191),
  and `showFooter = isEditable || isNotePanelOpen` (line 186) — so the save footer already appears
  in view mode when the note panel is open.
- `persistNoteForEvent` writes `notes.calendar_event_id = eventId` with no internal/external check.

The only thing missing is the entry point: `app/entities/calendar/components/EventSidebar.vue`
renders the `<NotesTabButton label="Add note">` **inside `<form v-if="isEditable">`** (lines 100-182).
External events fall into the `v-else` branch (`EventDetailsPanel`), which has no add-note button.
That makes Milestone 2 a genuinely small UI task, not a feature build.

### Sidebar / layout geometry (needed for Milestone 3)

`app/layouts/app.vue` — `.main { height: 100svh; display: flex; flex-direction: column }`, a header
row with `p-4` + `text-2xl` title + `border-b`, then `<div class="overflow-hidden flex flex-col flex-1">`
wrapping the page slot. `app/pages/app/calendar.vue` wraps the calendar in
`<div class="flex-1 overflow-auto">`. So the calendar's available height is
`100svh − header`, and the header measures ~65px (`2rem` padding + ~32px line-box + 1px border).

### Landing page is a stub

`app/pages/index.vue` is 19 lines: an `<h1>`, one paragraph, two `NuxtLink`s, and a footer with
Privacy Policy / Terms of Service links. It uses the `default` layout
(`app/layouts/default.vue` — a centering flex `<main>` with nothing else). Design tokens live in
`app/assets/css/main.css` (`--primary: #9688CF`, `--foreground`, `--border`, `--placeholder`,
`--card`, breakpoints `xs: 400px / tablet: 750px / desk: 1150px`). The only image asset is
`app/assets/images/logo.svg`; `public/` has just `favicon.ico` and `robots.txt`.

### Testing surface

`vitest.config.ts` includes `app/**/*.{test,spec}.ts` **and** `tests/unit/**`, jsdom env, globals
on, setup `tests/setup.ts`. Existing unit tests: `tests/unit/SupaButton.spec.ts`,
`tests/unit/validation.spec.ts`. E2E: `tests/e2e/auth.spec.ts`. **Colocated specs under `app/`
are already wired** — new pure-helper tests go next to the helper.

---

# Milestone 1 — Detached events (~1 working session)

**Why first:** it is the only one of the four that fixes wrong data rather than adding polish.
Right now the calendar shows meetings that no longer exist, which is worse than showing nothing.

**The state model:** an external event that vanished from the provider is **detached**, not deleted.
We keep the row because (a) notes may be linked to it via `notes.calendar_event_id` and deleting
the row would cascade or orphan them, and (b) the user's own history is worth more than mirror
fidelity. Detached = "this used to be on your Google Calendar; it isn't anymore; your notes on it
are still yours."

**Detection strategy: `synced_at` watermark, not an ID diff.** Every row written by a sync run
gets the same `synced_at = runStartedAt`. After the upsert, any row inside the synced window, on a
calendar this run actually fetched, whose `synced_at` is still older than `runStartedAt`, was not
returned by Google → it is gone upstream. This beats `external_event_id NOT IN (...)` because
`maxResults` is 2500 per calendar and that would build a query with thousands of literals.

### Task 1.1: Add the `detached_at` column

**Files:**
- Modify (manual, Supabase SQL editor): `calendar_events` table
- Regenerate: `app/shared/api/supabase/types/database.ts`

- [ ] **Step 1: Run this SQL in the Supabase SQL editor**

```sql
alter table public.calendar_events
  add column if not exists detached_at timestamptz;

comment on column public.calendar_events.detached_at is
  'Set when a synced external event stopped being returned by its provider. NULL = still present upstream. Paired with status = ''cancelled''.';

-- Supports the post-upsert sweep in the google-sync-events edge function.
create index if not exists calendar_events_sync_sweep_idx
  on public.calendar_events (google_account_id, calendar_id, synced_at)
  where google_account_id is not null;
```

- [ ] **Step 2: Regenerate the database types**

Run: `pnpm db:types`
Expected: `app/shared/api/supabase/types/database.ts` now has `detached_at: string | null` in the
`calendar_events` `Row`, and `detached_at?: string | null` in `Insert` and `Update`.

- [ ] **Step 3: Verify nothing else broke**

Run: `pnpm typecheck`
Expected: 0 errors. (Adding a nullable column is additive; no call site needs to change yet.)

- [ ] **Step 4: Commit**

```bash
git add app/shared/api/supabase/types/database.ts
git commit -m "add detached_at column to calendar_events"
```

### Task 1.2: Sweep vanished events in the sync edge function

**Files:**
- Modify: `supabase/functions/google-sync-events/index.ts:8-30` (`normalizeGoogleEvent`)
- Modify: `supabase/functions/google-sync-events/index.ts:74-134` (run body)

**Interfaces:**
- Produces: `calendar_events` rows with `status = 'cancelled'` and `detached_at` set for
  events that disappeared upstream. Restored events get `status` back from Google and
  `detached_at = null`. Consumed by Task 1.4's mapper.

- [ ] **Step 1: Make `normalizeGoogleEvent` clear `detached_at`**

Without this, an event deleted and then restored in Google would come back with a stale
`detached_at` and render blurred forever. Add one line to the returned object in
`supabase/functions/google-sync-events/index.ts`:

```ts
  return {
    title: event.summary ?? '(No title)',
    description: event.description ?? null,
    location: event.location ?? null,
    start_at: allDay ? `${startDate}T00:00:00.000Z` : startDateTime,
    end_at: allDay ? `${endDate}T00:00:00.000Z` : endDateTime,
    all_day: allDay,
    status: event.status ?? 'confirmed',
    organizer_email: event.organizer?.email ?? null,
    creator_email: event.creator?.email ?? null,
    html_link: event.htmlLink ?? null,
    etag: event.etag ?? null,
    updated_at_google: event.updated ?? null,
    // Anything Google still returns is by definition attached. Clearing this
    // un-detaches events that were deleted and then restored upstream.
    detached_at: null,
  }
```

- [ ] **Step 2: Stamp one run timestamp instead of per-row `new Date()`**

The sweep compares against this exact value, so every row in the run must share it. Replace the
`timeMin` / `timeMax` block (currently lines 75-76) and the per-row `synced_at`:

```ts
    const admin = createAdminClient()
    const runStartedAt = new Date().toISOString()
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
```

and in the `allRows.push({ ... })` call, change `synced_at: new Date().toISOString()` to:

```ts
          synced_at: runStartedAt,
```

- [ ] **Step 3: Add the sweep immediately after the upsert**

Insert this directly after the `if (allRows.length) { ... }` block and before the final
`select('*')`:

```ts
    // Google's list endpoint omits deleted events entirely (we pass singleEvents
    // without showDeleted), so a vanished event is detected by absence: any row in
    // the window, on a calendar this run actually fetched, whose synced_at was not
    // bumped to runStartedAt was not returned by Google.
    const syncedCalendarIds = (calendars ?? []).map((calendar) => calendar.calendar_id)

    if (syncedCalendarIds.length) {
      const { error: sweepError } = await admin
        .from('calendar_events')
        .update({ status: 'cancelled', detached_at: runStartedAt })
        .eq('google_account_id', googleAccountId)
        .in('calendar_id', syncedCalendarIds)
        .gte('start_at', timeMin)
        .lte('end_at', timeMax)
        .lt('synced_at', runStartedAt)
        .is('detached_at', null)

      if (sweepError) {
        throw new Error(sweepError.message)
      }
    }
```

Four scoping conditions, each load-bearing — do not drop any of them:

| Condition | Prevents |
|---|---|
| `.eq('google_account_id', ...)` | touching internal events (`is_internal` rows have a null `google_account_id`) or another account's rows |
| `.in('calendar_id', syncedCalendarIds)` | mass-detaching every event of a calendar the user just **deselected** in settings (a deselected calendar is not in `calendars`, so it is not swept) |
| `.gte/.lte` on the window | detaching events outside `[-30d, +90d]`, which this run never asked Google about |
| `.is('detached_at', null)` | rewriting `detached_at` on every subsequent sync, which would make "detached 3 months ago" always read as "detached just now" |

Note on ordering: if any calendar's fetch fails, the function `throw`s before the upsert, so the
sweep never runs on a partial result set. That is why the sweep goes after the upsert and not
inside the per-calendar loop.

- [ ] **Step 4: Deploy the function**

Run: `npx supabase functions deploy google-sync-events`
Expected: `Deployed Functions on project piqouitlhtmlnvyzvftd: google-sync-events`

- [ ] **Step 5: Verify manually against real data (no Deno test harness exists)**

1. In the app, hit the refresh button on `/app/calendar`. Note an external event's title.
2. Delete that event in Google Calendar (web UI).
3. Hit refresh in the app again.
4. In the Supabase SQL editor:

```sql
select title, status, detached_at, synced_at
from public.calendar_events
where google_account_id is not null
order by detached_at desc nulls last
limit 10;
```

Expected: the deleted event has `status = 'cancelled'` and a non-null `detached_at`; every other
event still has `status = 'confirmed'` and `detached_at is null`. If **everything** came back
cancelled, the `synced_at: runStartedAt` change in Step 2 did not land — check that no
`new Date().toISOString()` remains in the `allRows.push` call.

5. Restore the event in Google (trash → restore), refresh again, re-run the query.
Expected: `status = 'confirmed'`, `detached_at is null` — Step 1 working.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/google-sync-events/index.ts
git commit -m "detect events deleted upstream during google sync"
```

### Task 1.3: Unify the duplicate mappers

Do this *before* adding the display field, so the field only has to be added once. This is a pure
refactor — no behavior change, so it is safe to verify with typecheck alone.

**Files:**
- Modify: `app/entities/calendar/composables/calendar.ts:1-20` (delete local `mapEventToDisplay`)
- Modify: `app/entities/calendar/composables/calendar.ts:40,59` (call sites)

- [ ] **Step 1: Delete the duplicate and import the shared one**

In `app/entities/calendar/composables/calendar.ts`, delete the entire local `mapEventToDisplay`
function (lines 8-20) and the now-unused `CalendarEvent` / `CalendarEventDisplay` type imports it
needed, then import the helper:

```ts
import { useCalendarStore } from '../stores/calendar'
import { useGoogleCalendarStore } from '@features/integrations/google-calendar'
import { useGoogleCalendar } from '@features/integrations/google-calendar'
import { useInternalEvents } from './useInternalEvents'
import { mapCalendarEventRowToDisplay } from '../helpers'
```

- [ ] **Step 2: Update both call sites**

Line 40 (inside `fetchEvents`) and line 59 (inside `fetchEventsForRange`) both read
`allEvents.value.map(mapEventToDisplay)`. Change both to:

```ts
    const mapped = allEvents.value.map(mapCalendarEventRowToDisplay)
```

```ts
    return allEvents.value.map(mapCalendarEventRowToDisplay)
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm test`
Expected: 0 type errors, tests pass. `mapCalendarEventRowToDisplay` takes
`Database['public']['Tables']['calendar_events']['Row']` and `allEvents` is
`CalendarEvent[]` which is that same type, so this compiles with no cast.

- [ ] **Step 4: Commit**

```bash
git add app/entities/calendar/composables/calendar.ts
git commit -m "drop duplicate calendar event mapper"
```

### Task 1.4: Carry `isDetached` into the display type

**Files:**
- Modify: `app/entities/calendar/types/index.ts:10-24`
- Modify: `app/entities/calendar/helpers/index.ts:16-46`
- Test: `app/entities/calendar/helpers/index.spec.ts` (create)

**Interfaces:**
- Produces: `CalendarEventDisplay.isDetached: boolean` and `CalendarEventDisplay.detachedAt?: string`,
  consumed by Task 1.5 (CSS class) and Task 1.6 (sidebar badge).

- [ ] **Step 1: Write the failing test**

Create `app/entities/calendar/helpers/index.spec.ts`:

```ts
// Required: `mapToScheduleXEvent` calls `parseTemporalStart`, which uses the global
// `Temporal`. The app gets it from `useCalendarApp.ts:14`; `tests/setup.ts` does not
// install it, so without this import these tests fail with "Temporal is not defined".
import 'temporal-polyfill/global'
import { describe, expect, it } from 'vitest'
import { mapCalendarEventRowToDisplay, mapToScheduleXEvent } from './index'
import type { Database } from '@shared/api/supabase/types/database'

type CalendarEventRow = Database['public']['Tables']['calendar_events']['Row']

const row = (overrides: Partial<CalendarEventRow> = {}): CalendarEventRow => ({
  id: 'event-1',
  user_id: 'user-1',
  google_account_id: 'account-1',
  calendar_id: 'primary',
  external_event_id: 'google-1',
  title: 'Standup',
  description: null,
  location: null,
  start_at: '2026-08-12T09:00:00.000Z',
  end_at: '2026-08-12T09:30:00.000Z',
  all_day: false,
  is_internal: false,
  status: 'confirmed',
  organizer_email: null,
  creator_email: null,
  html_link: null,
  etag: null,
  updated_at_google: null,
  synced_at: '2026-08-12T08:00:00.000Z',
  detached_at: null,
  ...overrides,
})

describe('mapCalendarEventRowToDisplay', () => {
  it('marks an event detached when detached_at is set', () => {
    const result = mapCalendarEventRowToDisplay(
      row({ status: 'cancelled', detached_at: '2026-08-12T10:00:00.000Z' })
    )

    expect(result.isDetached).toBe(true)
    expect(result.detachedAt).toBe('2026-08-12T10:00:00.000Z')
  })

  it('leaves a live event attached', () => {
    const result = mapCalendarEventRowToDisplay(row())

    expect(result.isDetached).toBe(false)
    expect(result.detachedAt).toBeUndefined()
  })

  it('never marks an internal event detached', () => {
    const result = mapCalendarEventRowToDisplay(
      row({ is_internal: true, google_account_id: null, status: 'cancelled' })
    )

    expect(result.isDetached).toBe(false)
  })
})

describe('mapToScheduleXEvent', () => {
  it('tags detached events with the blur class', () => {
    const detached = mapCalendarEventRowToDisplay(
      row({ status: 'cancelled', detached_at: '2026-08-12T10:00:00.000Z' })
    )

    expect(mapToScheduleXEvent(detached)._options?.additionalClasses)
      .toContain('sx-event-detached')
  })

  it('adds no extra classes to a live event', () => {
    expect(mapToScheduleXEvent(mapCalendarEventRowToDisplay(row()))._options?.additionalClasses)
      .toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run app/entities/calendar/helpers/index.spec.ts`
Expected: FAIL — `Object literal may not have property 'isDetached'` / `expected undefined to be true`.

- [ ] **Step 3: Add the fields to the display type**

In `app/entities/calendar/types/index.ts`, extend `CalendarEventDisplay`:

```ts
export interface CalendarEventDisplay {
  id: string
  title: string
  start_at: string
  end_at: string
  all_day: boolean
  description?: string
  location?: string
  creator_email?: string
  html_link?: string
  /** Identifier used to assign per-account colors in ScheduleX */
  sourceAccountId?: string
  /** Discriminator for event origin */
  source: 'internal' | 'google'
  /**
   * True when this external event stopped being returned by its provider.
   * The row is kept on purpose so linked notes survive. Never true for internal events.
   */
  isDetached: boolean
  /** ISO timestamp of the sync run that first noticed the event was gone */
  detachedAt?: string
}
```

`isDetached` is deliberately **required, not optional** — that way `pnpm typecheck` points at
every construction site instead of silently defaulting to `undefined`.

- [ ] **Step 4: Set the fields in the mapper**

In `app/entities/calendar/helpers/index.ts`, replace `mapCalendarEventRowToDisplay`:

```ts
export const mapCalendarEventRowToDisplay = (event: CalendarEventRow): CalendarEventDisplay => ({
  id: event.id,
  title: event.title ?? '(No title)',
  start_at: event.start_at,
  end_at: event.end_at,
  all_day: event.all_day,
  description: event.description ?? undefined,
  location: event.location ?? undefined,
  creator_email: event.creator_email ?? undefined,
  html_link: event.html_link ?? undefined,
  sourceAccountId: event.is_internal ? `internal_${event.user_id}` : event.google_account_id ?? undefined,
  source: event.is_internal ? 'internal' : 'google',
  isDetached: !event.is_internal && Boolean(event.detached_at),
  detachedAt: event.detached_at ?? undefined,
})
```

`detached_at` is the source of truth rather than `status === 'cancelled'`, because `status` also
carries Google's own `cancelled` for events the user declined — those are still legitimately on
the calendar and must not be blurred.

- [ ] **Step 5: Tag the Schedule-X event**

Still in `app/entities/calendar/helpers/index.ts`, replace `mapToScheduleXEvent`:

```ts
export const mapToScheduleXEvent = (event: CalendarEventDisplay): CalendarEventExternal => {
  const isReadOnly = event.source !== 'internal'

  return {
    id: event.id,
    start: parseTemporalStart(event.start_at, event.all_day),
    end: parseTemporalStart(event.end_at, event.all_day),
    title: event.title,
    description: event.description,
    location: event.location,
    calendarId: event.sourceAccountId,
    _options: {
      disableDND: isReadOnly,
      disableResize: isReadOnly,
      additionalClasses: event.isDetached ? ['sx-event-detached'] : [],
    },
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm vitest run app/entities/calendar/helpers/index.spec.ts`
Expected: PASS, 5 tests.

- [ ] **Step 7: Verify the whole project still compiles**

Run: `pnpm typecheck && pnpm test`
Expected: 0 errors. If `event-sidebar.ts` or a test fixture builds a `CalendarEventDisplay`
literal by hand, typecheck will flag the missing `isDetached` — add `isDetached: false` there.

- [ ] **Step 8: Commit**

```bash
git add app/entities/calendar/types/index.ts app/entities/calendar/helpers/index.ts app/entities/calendar/helpers/index.spec.ts
git commit -m "carry detached state into calendar display events"
```

### Task 1.5: Blur detached events in the grid

**Files:**
- Modify: `app/pages/app/calendar.vue:39-55` (`<style scoped>`)

- [ ] **Step 1: Add the detached style**

Append to the existing `<style scoped>` block in `app/pages/app/calendar.vue`. Keep it inside
`:deep()` — the class is applied by Schedule-X to a node it owns, so scoped-CSS attribute
hashing will not reach it otherwise.

```css
/* Applied via _options.additionalClasses for external events that vanished
   upstream. Readable but visibly not-real: dimmed, desaturated, faintly blurred,
   with a dashed edge so the state survives grayscale and colorblind viewing. */
:deep(.sx-event-detached) {
  opacity: 0.5;
  filter: saturate(0.45) blur(0.6px);
  border: 1px dashed var(--placeholder) !important;
  transition: opacity 0.15s ease, filter 0.15s ease;
}

/* Un-blur on hover so the title stays readable when the user goes to click it. */
:deep(.sx-event-detached:hover),
:deep(.sx-event-detached:focus-within) {
  opacity: 0.85;
  filter: saturate(0.75);
}
```

Two deliberate choices: the blur is `0.6px` (legible at a glance, unmistakably "off" — a heavier
blur makes the title unreadable and the event unclickable in practice), and the dashed border
carries the same signal without relying on color or opacity, which is what keeps this accessible.

- [ ] **Step 2: Verify in the browser**

Run: `pnpm dev`, open `/app/calendar`.
Expected: the event deleted in Task 1.2 Step 5 renders dimmed/dashed; every other event is
unchanged; clicking the detached one still opens the sidebar.

- [ ] **Step 3: Commit**

```bash
git add app/pages/app/calendar.vue
git commit -m "blur detached events in the calendar grid"
```

### Task 1.6: Explain the detached state in the sidebar

**Files:**
- Modify: `app/entities/calendar/components/EventDetailsPanel.vue`

- [ ] **Step 1: Add a formatter for the detached timestamp**

In the `<script setup>` of `app/entities/calendar/components/EventDetailsPanel.vue`, after the
existing `isInternal` computed:

```ts
const isInternal = computed(() => props.selectedEvent?.source === 'internal')

const detachedOn = computed(() => {
  const detachedAt = props.selectedEvent?.detachedAt
  if (!detachedAt) return ''

  return new Date(detachedAt.replace(/\[.*\]$/, '')).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})
```

The `.replace(/\[.*\]$/, '')` strips a Temporal bracketed timezone suffix — the same defensive
strip the file already does in `formatDate` (line 34).

- [ ] **Step 2: Add the notice to the template**

Insert directly after the opening `<template v-else>` (line 85) and before the title paragraph, so
the state is the first thing read:

```html
    <template v-else>
      <div
        v-if="selectedEvent.isDetached"
        class="flex items-start gap-2 rounded-md border border-dashed border-placeholder bg-placeholder/10 p-3"
      >
        <Icon name="lucide:unlink" class="mt-0.5 size-4 shrink-0 text-placeholder" />
        <div class="space-y-0.5">
          <p class="font-medium text-foreground">Detached event</p>
          <p class="text-xs text-placeholder">
            This event is no longer in the connected calendar<template v-if="detachedOn"> (noticed {{ detachedOn }})</template>.
            Planify keeps it so your notes stay linked.
          </p>
        </div>
      </div>

      <p v-if="showTitle" class="text-base font-medium text-foreground">
        {{ selectedEvent.title }}
      </p>
```

- [ ] **Step 3: Soften the dead "Link to original event" link**

A detached event's `html_link` now points at a deleted Google event and 404s. Change the link
block (currently lines 105-107) so it does not promise something that no longer works:

```html
      <div v-if="selectedEvent.html_link && !selectedEvent.isDetached" class="flex items-start gap-2 text-blue-600">
        <a :href="selectedEvent.html_link" target="_blank" rel="noreferrer">Link to original event</a>
      </div>
```

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm test`, then `pnpm dev` and click the detached event.
Expected: the notice renders above the title, the original-event link is gone, and normal
external events are visually unchanged.

- [ ] **Step 5: Commit**

```bash
git add app/entities/calendar/components/EventDetailsPanel.vue
git commit -m "explain detached events in the event sidebar"
```

**Explicitly out of scope for Milestone 1** (worth a follow-up, do not silently absorb):
- Events deleted upstream **outside** the `[-30d, +90d]` sync window are never noticed. Fixing
  that properly means moving to Google's incremental `syncToken` + `showDeleted=true` flow, which
  is a rewrite of the sync function, not an edit.
- Events belonging to a **deselected** calendar stay visible and un-detached. Deciding whether
  deselecting should hide, detach, or delete is a product decision — see Decision Points.
- `CalendarSearch.vue` filters the same in-memory store and will happily return detached events
  with no visual marker. One-line follow-up: dim the row when `event.isDetached`.

---

# Milestone 2 — Add notes to external events from the sidebar (~half a session)

**Why it is small:** per Grounding, `useEventSidebar` already persists notes in view mode. This
milestone adds a button and passes an event through. No composable logic, no schema, no store.

### Task 2.1: Surface "Add note" in the read-only sidebar branch

**Files:**
- Modify: `app/entities/calendar/components/EventDetailsPanel.vue` (add `addNote` emit + button)
- Modify: `app/entities/calendar/components/EventSidebar.vue:184-194` (wire it)

**Interfaces:**
- Consumes: `openNotePanel()` and `isNotePanelOpen` from `useEventSidebar` (already exported,
  see `event-sidebar.ts:756,771`).
- Produces: `EventDetailsPanel` emits `addNote: []`.

- [ ] **Step 1: Add the emit and a prop to `EventDetailsPanel`**

In `app/entities/calendar/components/EventDetailsPanel.vue`, extend the props and emits. The
`canAddNote` prop keeps the button out of the read-only `EventDetailsModal` usage, which has no
sidebar to open a note panel in.

```ts
const props = withDefaults(
  defineProps<{
    selectedEvent?: CalendarEventDisplay | null
    eventNotes?: Note[]
    showActions?: boolean
    showTitle?: boolean
    clickableNotes?: boolean
    deleting?: boolean
    canAddNote?: boolean
  }>(),
  {
    eventNotes: () => [],
  }
)

const emit = defineEmits<{
  edit: []
  delete: []
  noteClick: [note: Note]
  addNote: []
}>()
```

- [ ] **Step 2: Render the button**

Insert between the existing notes list block (ends line 130) and the actions block (line 132),
so "Add note" reads as the last item of the Notes section:

```html
      <button
        v-if="canAddNote"
        type="button"
        class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-dashed border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-menu-item-hover"
        @click="emit('addNote')"
      >
        <span class="text-sm font-medium text-foreground">
          {{ eventNotes.length ? 'Add another note' : 'Add note' }}
        </span>
        <Icon name="heroicons:plus" class="size-4 shrink-0 text-placeholder" />
      </button>
```

- [ ] **Step 3: Wire it in `EventSidebar.vue`**

`openNotePanel` is already destructured from `useEventSidebar` at the top of the file (line 25) —
it is currently only used by the editable branch. Add two lines to the `v-else` usage:

```html
      <EventDetailsPanel
        v-else
        :selected-event="selectedEvent"
        :event-notes="eventNotes"
        clickable-notes
        show-actions
        :can-add-note="!isNotePanelOpen"
        :deleting
        @edit="openEdit"
        @delete="handleDelete"
        @note-click="openNote"
        @add-note="openNotePanel"
      />
```

`!isNotePanelOpen` mirrors the editable branch's `v-if="!isNotePanelOpen"` on its own
`NotesTabButton` (line 170) — no "Add note" button while a note is already being written.

- [ ] **Step 4: Verify by hand**

Run: `pnpm typecheck && pnpm test`, then `pnpm dev`.
1. Open `/app/calendar`, click a **Google** event.
2. Expected: "Add note" appears at the bottom of the details panel.
3. Click it → the note panel expands, the footer appears with **"Save note"**.
4. Type a title + content, click Save.
5. Expected: success toast, the note appears under "Notes" in the panel, the URL gains
   `eventNoteId=<uuid>`.
6. Reload the page with that URL still in the bar. Expected: the sidebar reopens with that note
   already selected (this exercises the `eventNoteId` restore path at `event-sidebar.ts:673-680`).
7. Go to `/app/notes` and filter **Linked**. Expected: the new note is there, linked to the
   Google event.
8. Repeat step 1-5 on a **detached** event from Milestone 1. Expected: it works — that is the
   whole point of keeping detached rows.

- [ ] **Step 5: Review the Vue diff**

Run the `vue-component-reviewer` agent over the two changed `.vue` files. This surface
(sidebar + notes + Schedule-X) is exactly what that agent was written for.

- [ ] **Step 6: Commit**

```bash
git add app/entities/calendar/components/EventDetailsPanel.vue app/entities/calendar/components/EventSidebar.vue
git commit -m "allow adding notes to external events from the event sidebar"
```

---

# Milestone 3 — Calendar density and 07:00 initial scroll (~half a session)

**The actual problem:** with `dayBoundaries` silently ignored (see Grounding), Schedule-X renders
a full midnight-to-midnight day at its default grid height. On a laptop the user sees roughly a
third of the day and always starts at 00:00 — the least useful hours occupy the viewport.

**The fix has two independent halves.** Density (`gridHeight`) controls how much day fits;
`initialScroll` controls where the viewport lands. Both are needed: shrinking the grid alone still
opens at midnight, and scrolling alone still shows only a few hours.

**Why not just clamp `dayBoundaries` to 06:00-22:00?** Because it *hides* events. An event at
05:30 would silently vanish from the week view. Full-day boundaries + a smaller row height +
initial scroll gets the same screen density with nothing hidden. Keep `dayBoundaries` full-day.

**And do not try to fit all 24 hours on screen.** A 645px-tall grid area over 24 hours is 27px per
hour, which makes a 30-minute event 13px tall — unreadable, and nearly unclickable. The target is
to fit a **working day (12 hours)** in the viewport at a readable row height, and let the 07:00
initial scroll put those 12 hours where the user is looking. Everything outside them is one scroll
away, not hidden.

### Task 3.1: Add the scroll-controller plugin

**Files:**
- Modify: `package.json`
- Modify: `app/entities/calendar/composables/useCalendarApp.ts`

- [ ] **Step 1: Install the plugin, pinned to match the others**

Run: `pnpm add -E @schedule-x/scroll-controller@3.7.3`
Expected: `package.json` gains `"@schedule-x/scroll-controller": "3.7.3"` with **no** caret,
matching `current-time` / `drag-and-drop` / `resize`. (Version 3.7.3 is confirmed published;
4.x exists but is out of scope — see Global Constraints.)

- [ ] **Step 2: Verify**

Run: `pnpm typecheck`
Expected: 0 errors (nothing imports it yet).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "add schedule-x scroll controller plugin"
```

### Task 3.2: Fix the dead config and set density + initial scroll

**Files:**
- Modify: `app/entities/calendar/composables/useCalendarApp.ts:86-188`
- Create: `app/entities/calendar/helpers/grid.ts`
- Test: `app/entities/calendar/helpers/grid.spec.ts`

**Interfaces:**
- Produces: `computeGridHeight(viewportHeight: number): number` and the constants
  `DAY_START_HOUR`, `INITIAL_SCROLL_TIME`, `VISIBLE_HOURS`, `MIN_HOUR_HEIGHT`, `MAX_HOUR_HEIGHT`
  from `app/entities/calendar/helpers/grid.ts`.
- Produces: `scrollController` (a `@schedule-x/scroll-controller` instance) inside
  `useCalendarApp`, consumed by Task 3.3's `goToDate`.

- [ ] **Step 1: Write the failing test**

Create `app/entities/calendar/helpers/grid.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { computeGridHeight, MIN_HOUR_HEIGHT, MAX_HOUR_HEIGHT, VISIBLE_HOURS } from './grid'

const hourHeight = (viewportHeight: number) => computeGridHeight(viewportHeight) / 24

describe('computeGridHeight', () => {
  it('fits a working day into a laptop viewport at a readable row height', () => {
    // 800px viewport - ~155px of chrome = ~645px of grid area, over 12 hours
    expect(hourHeight(800)).toBeGreaterThanOrEqual(MIN_HOUR_HEIGHT)
    expect(hourHeight(800)).toBeLessThanOrEqual(MAX_HOUR_HEIGHT)
    expect(hourHeight(800) * VISIBLE_HOURS).toBeLessThanOrEqual(800)
  })

  it('never squeezes rows below the readable minimum on a tiny viewport', () => {
    expect(hourHeight(400)).toBe(MIN_HOUR_HEIGHT)
  })

  it('never stretches rows past the maximum on a huge display', () => {
    expect(hourHeight(2160)).toBe(MAX_HOUR_HEIGHT)
  })

  it('is denser than the schedule-x default for a normal laptop', () => {
    // The whole point of the task: the default grid is ~2500-3000px tall.
    expect(computeGridHeight(800)).toBeLessThan(2000)
  })

  it('returns whole pixels', () => {
    expect(Number.isInteger(computeGridHeight(923))).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run app/entities/calendar/helpers/grid.spec.ts`
Expected: FAIL — `Failed to resolve import "./grid"`.

- [ ] **Step 3: Write the helper**

Create `app/entities/calendar/helpers/grid.ts`:

```ts
/** Hour the week/day grid scrolls to on open — the start of a working day. */
export const DAY_START_HOUR = 7

/** Schedule-X scroll-controller format is HH:MM. */
export const INITIAL_SCROLL_TIME = '07:00'

/**
 * How many hours we aim to have on screen at once — a working day. The grid still
 * covers all 24 hours; the other 12 are a scroll away rather than hidden.
 */
export const VISIBLE_HOURS = 12

/** Below this, a 30-minute event is too short to read its title in. */
export const MIN_HOUR_HEIGHT = 36

/** Above this we are back to the original problem: a handful of hours per screen. */
export const MAX_HOUR_HEIGHT = 72

/**
 * Chrome above the time grid that eats vertical space:
 * app layout header (~65px: p-4 + text-2xl line box + 1px border)
 * + Schedule-X's own header bar and all-day row (~90px).
 */
const CHROME_HEIGHT = 155

/**
 * Total px height Schedule-X should give the full 24-hour grid, derived so that
 * VISIBLE_HOURS of it fill the viewport. Clamped at both ends so neither a phone
 * nor a 4K monitor produces unusable row heights.
 */
export const computeGridHeight = (viewportHeight: number): number => {
  const available = viewportHeight - CHROME_HEIGHT
  const hourHeight = Math.min(
    MAX_HOUR_HEIGHT,
    Math.max(MIN_HOUR_HEIGHT, available / VISIBLE_HOURS),
  )

  return Math.round(hourHeight * 24)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run app/entities/calendar/helpers/grid.spec.ts`
Expected: PASS, 5 tests. Sanity check on the numbers:

| Viewport | available / 12 | clamped hour height | `gridHeight` | hours on screen |
|---|---|---|---|---|
| 400px (phone) | 20.4 | 36 (floor) | 864 | ~6.8 |
| 800px (laptop) | 53.75 | 53.75 | 1290 | 12 |
| 1080px | 77.1 | 72 (ceiling) | 1728 | ~12.8 |
| 2160px (4K) | 167 | 72 (ceiling) | 1728 | 24 (whole day fits) |

- [ ] **Step 5: Export the helper**

Append to `app/entities/calendar/index.ts`:

```ts
export { computeGridHeight, DAY_START_HOUR, INITIAL_SCROLL_TIME } from './helpers/grid'
```

- [ ] **Step 6: Take `dayBoundaries` and `weekOptions` out of the calendars map**

This is the bug fix. In `app/entities/calendar/composables/useCalendarApp.ts`, replace
`buildCalendarsConfig` (lines 86-109) so it returns **only** calendar-id → color entries:

```ts
  const buildCalendarsConfig = () => {
    const accounts = googleCalendarStore.accounts
    const prefs = settingsStore.preferences
    // Schedule-X expects this to be a map of calendarId -> color config only.
    // Anything else here (it used to also carry dayBoundaries and weekOptions)
    // is silently read as a calendar named after the key and has no effect.
    const config: Record<string, any> = {}

    const userId = userStore.user?.id
    if (userId) {
      config[`internal_${userId}`] = prefs?.eventsColors['internal'] ?? INTERNAL_CALENDAR_COLOR
    }

    accounts.forEach((account, index) => {
      config[account.id] = prefs?.eventsColors[account.id] ?? ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
    })

    return config
  }
```

This also repairs the settings watcher at lines 194-203, which writes `buildCalendarsConfig()`
straight into `calendarState.calendars.value` — it was injecting the two junk keys on every
preference change.

- [ ] **Step 7: Wire density, boundaries and the scroll plugin into `createCalendar`**

Add the import at the top of `app/entities/calendar/composables/useCalendarApp.ts`, next to the
other plugin imports:

```ts
import { createScrollControllerPlugin } from '@schedule-x/scroll-controller'
import { computeGridHeight, INITIAL_SCROLL_TIME } from '../helpers/grid'
```

Create the plugin instance above `createCalendar` (it is needed both in the plugin array and by
Task 3.3):

```ts
  const scrollController = createScrollControllerPlugin({
    initialScroll: INITIAL_SCROLL_TIME,
  })
```

Then change the `createCalendar` call. `weekOptions` gains `gridHeight` at the top level where
Schedule-X actually reads it, and the plugin joins the array:

```ts
  const calendarApp = createCalendar({
    selectedDate: Temporal.PlainDate.from(Temporal.Now.plainDateISO().toString()),
    calendars: buildCalendarsConfig(),
    // dayBoundaries is deliberately omitted: its default is already midnight-to-midnight,
    // and clamping it would hide early/late events rather than just making the grid
    // denser. Density is gridHeight's job, visible range is initialScroll's job.
    weekOptions: {
      eventWidth: 95,
      gridHeight: computeGridHeight(window.innerHeight),
    },
    timezone: Temporal.Now.timeZoneId(),
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    events: [],
    callbacks: {
      // ...unchanged
    },
  }, [
    createDragAndDropPlugin(),
    createResizePlugin(),
    createCurrentTimePlugin(),
    scrollController,
  ])
```

`window.innerHeight` is safe to read at module-composable scope here: `nuxt.config.ts` sets
`ssr: false`, so this only ever runs in the browser.

- [ ] **Step 8: Verify**

Run: `pnpm typecheck && pnpm test`, then `pnpm dev` → `/app/calendar`.
Expected: week view opens scrolled to 07:00 (not 00:00), and roughly a full working day is
visible without scrolling. Events at 02:00 still exist and are reachable by scrolling up.

- [ ] **Step 9: Commit**

```bash
git add package.json app/entities/calendar/composables/useCalendarApp.ts app/entities/calendar/helpers/grid.ts app/entities/calendar/helpers/grid.spec.ts app/entities/calendar/index.ts
git commit -m "fit calendar grid to viewport and open at 07:00"
```

### Task 3.3: Re-apply the 07:00 scroll on view and date changes

`initialScroll` only fires on first render. Switching Month → Week, or jumping to a date from
`CalendarSearch`, re-mounts the time grid at the top again.

**Files:**
- Modify: `app/entities/calendar/composables/useCalendarApp.ts:212-218` (`goToDate`)
- Modify: `app/pages/app/calendar.vue:15-18` (`handleSearchSelect`)

**Interfaces:**
- Consumes: `scrollController` and `INITIAL_SCROLL_TIME` from Task 3.2.
- Produces: `goToDate(iso: string, scrollToIso?: string): void` — the second argument is new;
  the existing one-argument call sites keep working unchanged.

- [ ] **Step 1: Re-scroll after a programmatic date jump**

In `useCalendarApp`, replace `goToDate` (currently lines 212-218) with this. Two changes: it
re-scrolls after `setDate`, and it takes an optional hour to scroll to instead of always using
07:00 — landing on 07:00 is wrong when the user searched for a 19:00 event. The `nextTick` matters:
the re-rendered grid has to exist before it can be scrolled.

```ts
  const goToDate = (iso: string, scrollToIso?: string) => {
    const ymd = isoToYmd(iso)
    const ctrl = (calendarApp as any).setDate ?? (calendarApp as any).calendarControls?.setDate
    if (typeof ctrl === 'function') {
      ctrl.call(calendarApp, ymd)
    }

    const target = scrollToIso
      ? new Date(scrollToIso.replace(/\[.*\]$/, ''))
      : null
    const time = target
      ? `${String(target.getHours()).padStart(2, '0')}:00`
      : INITIAL_SCROLL_TIME

    // setDate re-renders the time grid, which resets it to the top; initialScroll
    // only applies on first render, so put the viewport back where it belongs.
    nextTick(() => scrollController.scrollTo(time))
  }
```

- [ ] **Step 2: Pass the event's own hour from the search handler**

In `app/pages/app/calendar.vue`, replace `handleSearchSelect` (lines 15-18):

```ts
const handleSearchSelect = (event: CalendarEventDisplay) => {
  goToDate(event.start_at)
  openEventView(event)
}
```

with:

```ts
const handleSearchSelect = (event: CalendarEventDisplay) => {
  // An all-day event has no meaningful hour, so let goToDate fall back to the
  // working-day start; a timed event should land on its own hour.
  goToDate(event.start_at, event.all_day ? undefined : event.start_at)
  openEventView(event)
}
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm test`, then `pnpm dev`.
1. `/app/calendar` in week view → opens at 07:00. ✅
2. Switch to Month, back to Week → still lands at 07:00, not 00:00.
3. Search an event at ~19:00 and select it → the grid jumps to its date **and** scrolls so the
   19:00 slot is in view.
4. Search an all-day event → jumps to its date, viewport at 07:00.

If step 2 fails (Month → Week still lands at 00:00), the view switch does not go through
`goToDate` — it is Schedule-X's own view selector. Fix by watching the calendar's view state
instead of adding a `goToDate` call: `watch(() => (calendarApp as any).$app?.calendarState?.view?.value, () => nextTick(() => scrollController.scrollTo(INITIAL_SCROLL_TIME)))`.
That reaches into `$app`, which the file already does in four other places (lines 198, 206, 236),
so it is consistent with the existing approach rather than a new kind of hack.

- [ ] **Step 4: Commit**

```bash
git add app/entities/calendar/composables/useCalendarApp.ts app/pages/app/calendar.vue
git commit -m "keep calendar scrolled to the working day across view changes"
```

### Task 3.4 (optional, do last): make the start hour a user preference

Only worth doing if the hardcoded 07:00 turns out to annoy. `settingsStore.preferences` currently
holds **only** `eventsColors`, so this means extending the preferences shape, the settings page,
and the persisted row — a real task, not a tweak. Deliberately deferred; `DAY_START_HOUR` in
`helpers/grid.ts` is already the single place it would be read from.

---

# Milestone 4 — Real landing page (~1-2 sessions, design-heavy)

**Why it matters beyond looks:** `/` is the OAuth homepage Google's verification reviewers land
on, and the only page that explains the product to a stranger. Right now it is 19 lines of
unstyled text with an `<h1>`, one sentence, and two bare links. It is also the page a diploma
committee will see first.

**REQUIRED SUB-SKILL:** invoke `frontend-design` before writing any landing markup. Do not
freehand this one — the whole point is that it should not read as a templated default.

### Decision required before starting: SSR

`nuxt.config.ts` has `ssr: false`. A SPA landing page ships an empty `<div id="__nuxt">` to
crawlers and to Google's OAuth reviewer, and gets a poor LCP. Three options:

1. **Leave `ssr: false`.** Zero risk, zero work. The landing page is invisible to search engines.
   Fine if acquisition is not a goal (it probably is not, for a diploma project).
2. **Hybrid**: `ssr: true` globally + `routeRules: { '/app/**': { ssr: false } }` and prerender
   the public routes. Correct outcome, but a real risk surface — `@nuxtjs/supabase`, Pinia stores,
   and `window` reads (including `computeGridHeight(window.innerHeight)` from Task 3.2) all have
   to survive a server pass. Budget a session for it, not an afternoon.
3. **Static-only landing**: keep the SPA and hand-write the marketing HTML into `public/`.
   Cheap and effective, but the landing then shares nothing with the app's components or tokens
   and will drift.

Recommendation: **(1) now, (2) only if the project ever needs organic traffic.** Build the landing
as real Vue components either way — that keeps door (2) open at no extra cost.

### Task 4.1: Landing feature slice with real content

**Files:**
- Create: `app/features/landing/components/LandingHero.vue`
- Create: `app/features/landing/components/LandingFeatureGrid.vue`
- Create: `app/features/landing/components/LandingHowItWorks.vue`
- Create: `app/features/landing/components/LandingFooter.vue`
- Create: `app/features/landing/index.ts`
- Modify: `app/pages/index.vue`

Run the `fsd-place` skill to confirm before creating: these are `features`-layer components (they
compose product-specific marketing UI and may import from `shared`), and the page composes them.
They must import primitives only from `shared/ui` (`SupaButton` et al. are globally registered
via `nuxt.config.ts` `components`), never from `entities/calendar` or another feature.

- [ ] **Step 1: Invoke the design skill**

Load `frontend-design` and settle the aesthetic direction *before* writing markup: type scale,
whether the hero carries a product screenshot or an abstract calendar motif, light-only or
light+dark. Constraints to hand it: existing token set in `app/assets/css/main.css`, primary
`#9688CF` (violet), Tailwind 4, breakpoints `xs/tablet/desk` at `400/750/1150px`, the only
existing brand asset is `app/assets/images/logo.svg`.

- [ ] **Step 2: Write the copy first, from what actually ships**

Do not invent features. Every claim below is a thing the codebase does today — verify against
the app before writing it into a headline:

| Section | Claim | Backed by |
|---|---|---|
| Hero | Several Google Calendars, one grid | `google_accounts` is 1-to-many per user; `ACCOUNT_COLORS` gives each account its own color |
| Feature | Notes attached to events | `notes.calendar_event_id`, the split sidebar, `/app/notes` with linked/unlinked filters |
| Feature | Your own events alongside synced ones | `calendar_events.is_internal`, drag-and-drop + resize on internal events only |
| Feature | Search across every calendar at once | `CalendarSearch.vue` over the merged in-memory store |
| Feature | Drafts survive a reload | `useStorage('planify:event-sidebar-drafts')` in `event-sidebar.ts:128` |
| Feature | A dashboard of how your time actually goes | `app/entities/charts`, `app/features/dashboard`, chart.js |
| Trust | Read-only mirror of Google data; disconnect any time | `deleteAccount` in `useGoogleCalendar`, per-calendar `selected` flag |

- [ ] **Step 3: Build the sections as separate components**

One responsibility per file, per the plan's file-structure rule. Each takes no props (static
marketing content) except `LandingFeatureGrid`, which takes its items as a typed array so copy
edits stay in one place:

```ts
// app/features/landing/components/LandingFeatureGrid.vue
interface LandingFeature {
  icon: string      // lucide/heroicons name, resolved by @nuxt/icon
  title: string
  body: string
}
```

- [ ] **Step 4: Add a real page `<head>`**

`app/pages/index.vue` currently sets no meta at all. Add:

```ts
useHead({
  title: 'Planify — all your calendars in one place',
  meta: [
    {
      name: 'description',
      content: 'Planify brings several Google Calendars into one view, lets you keep notes attached to the events they belong to, and shows where your time actually goes.',
    },
    { property: 'og:title', content: 'Planify — all your calendars in one place' },
    { property: 'og:description', content: 'One calendar view across every Google account, with notes attached to your events.' },
    { property: 'og:type', content: 'website' },
  ],
})
```

- [ ] **Step 5: Compose the page**

`app/pages/index.vue` becomes a thin composition — sections in order, `default` layout, and the
Privacy Policy / Terms of Service links **kept** in `LandingFooter` (they are linked from the
Google OAuth consent screen; removing them breaks verification).

- [ ] **Step 6: Verify**

Run: `pnpm typecheck && pnpm test && pnpm dev`.
1. `/` renders the new landing.
2. Resize to 375px wide → no horizontal scroll, nothing clipped.
3. `/privacy-policy` and `/terms-of-service` still reachable from the footer.
4. "Log in" → `/login`; the app-entry CTA → `/app` (and bounces to `/login` when signed out —
   check `app/middleware` still guards it).
5. Run a Lighthouse pass. Accept that SEO/LCP will be mediocre while `ssr: false` stands; the
   accessibility and contrast scores should not be.

- [ ] **Step 7: Review the Vue diff**

Run the `vue-component-reviewer` agent over the new `.vue` files.

- [ ] **Step 8: Commit**

```bash
git add app/features/landing app/pages/index.vue
git commit -m "build real landing page"
```

### Task 4.2 (optional): screenshots in the hero

Needs the app populated with presentable fake data, screenshots taken at a fixed viewport,
optimized, and committed to `public/`. Do it after Milestones 1-3 land, so the screenshots show
the *fixed* calendar (fitted grid, 07:00 scroll) rather than the current one. Note that
committing screenshots of a real calendar means committing whatever is on it — use a throwaway
Google account, not the personal one.

---

## Ordering recommendation

1. **Milestone 1** (detached events) — fixes wrong data; everything else is polish.
2. **Milestone 3** (density + scroll) — smallest ratio of effort to daily benefit, and it
   repairs a real config bug. Also makes Task 4.2 screenshots worth taking.
3. **Milestone 2** (sidebar notes) — half a session, no dependencies.
4. **Milestone 4** (landing) — biggest, most open-ended, benefits from 1-3 being visibly done.

Milestones 1-3 are all inside `app/entities/calendar` + one edge function; if two of them are ever
worked in parallel, do it in separate worktrees (`superpowers:using-git-worktrees`) since
`useCalendarApp.ts` and `helpers/index.ts` are touched by both 1 and 3.

---

## Decision points — OPEN, resolve before starting the milestone that needs them

1. **Detached retention (Milestone 1).** Detached rows accumulate forever. Options: keep
   indefinitely; auto-purge detached events with no linked note after N days; add a "clear
   detached" action in settings. Recommendation: **keep indefinitely for now** — the volume is
   trivial for a single-user diploma project, and purging is a one-query follow-up whenever it
   starts to matter.
2. **Deselected calendars (Milestone 1).** When a user deselects a Google calendar in settings,
   its already-synced events currently stay in the grid, un-detached and indistinguishable from
   live ones. Should deselecting hide them, detach them, or delete them? Recommendation: **hide**
   (filter by `google_calendars.selected` in `loadEventsFromDb`) — it is reversible, unlike
   delete, and honest, unlike the current behavior. Not planned above; needs its own small task.
3. **Detached events in search (Milestone 1).** Mark them dimmed in `CalendarSearch`, or exclude
   them from results entirely? Recommendation: **dim, do not exclude** — consistent with keeping
   them in the grid.
4. **SSR for the landing page (Milestone 4).** See the three options in Milestone 4.
   Recommendation: option 1 (leave `ssr: false`) unless organic traffic becomes a goal.
5. **Diploma attribution.** Per `docs/diploma-collaboration-strategy.md`, the partner needs an
   isolated, defendable scope. None of these four milestones is a good candidate — 1-3 are edits
   threaded through existing calendar internals, and 4 is design work with no logic to defend.
   Keep all four as Dmytro's; the Telegram bot stays the partner's unit.

---

## Suggested execution loop (when you return)

Per milestone: re-read the Grounding section (it is the part most likely to have gone stale) →
verify the line numbers still match → execute tasks in order with TDD → `pnpm typecheck && pnpm test`
→ `vue-component-reviewer` agent on any `.vue` diff → commit per task, not per milestone.

After Milestone 1's edge-function change, remember the deploy is **not** automatic:
`npx supabase functions deploy google-sync-events` is a separate step from the git push, and
forgetting it means the frontend ships a feature the backend never populates.
