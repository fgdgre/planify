# API Usage Audit — 2026-10-13

> Follow-up to [issue #31](https://github.com/fgdgre/planify/issues/31) ("refactor api usage —
> reduce amount of fetches in case with three connected accounts"). Re-verifies the
> 2026-10-12 investigation against source, puts numbers on the problem, and records what
> the `reduce-api-usage` branch changes and what still needs backend work.

## 1. Verdict on the earlier report

Everything the 2026-10-12 investigation claimed is confirmed against `main` (`71fd4e9`):

| Claim | Where | Verified |
|---|---|---|
| Middleware runs `list-calendars` + `sync-events` for **every** account on **every** navigation | `app/middleware/google-calendar-events.ts:30-37` | ✅ |
| Two `supabase.auth.refreshSession()` round-trips per account per navigation | `useGoogleCalendar.ts:11-24`, called from `fetchCalendarEvents` and `syncEvents` | ✅ |
| `loadEventsFromDb` called before **and** after each sync | `useGoogleCalendar.ts:124-146` | ✅ |
| No TTL / staleness flag in the Pinia store | `stores/google-calendar.ts` | ✅ |
| Edge functions do a full ±120-day re-fetch per call, no `syncToken`, response body discarded by the client | `supabase/functions/google-sync-events/index.ts` | ✅ |
| Only guard is the same-path check on `/app/calendar` | `middleware:13-17` | ✅ |

What the earlier report under-counted or missed:

1. **It counted the middleware only.** The calendar page adds its own fan-out on mount and on
   every view/date change (`useCalendar.fetchEvents`: one `calendar_events` query per account
   plus one for internal events). The dashboard does the same with **no date filter at all**
   (`useDashboard.load`: every event of every account, to draw a one-week chart).
2. **Query-only navigations on the dashboard were unguarded.** Clicking an event in
   "Today's Schedule" does `router.replace({ query })`. Nuxt runs page middleware for every
   navigation including query-only ones (`nuxt/dist/pages/runtime/plugins/router.js:134-143`
   adds `to.matched[*].meta.middleware` with no path-equality skip). The `/app/calendar`
   guard did not cover `/app`, so every click on the dashboard re-ran the full pipeline.
3. **`refreshSession()` is not just an extra request — it rotates the refresh token every
   call.** supabase-js dedupes *concurrent* refreshes behind `refreshingDeferred`
   (`auth-js/GoTrueClient.js:1968-1990`), so the network count is roughly two rotations per
   navigation rather than 2 × N, but each one invalidates the previous refresh token for the
   whole browser session. `getSession()` refreshes only when the access token is within the
   expiry margin.
4. **`google-list-calendars` resets `selected = is_primary` on every upsert** (`index.ts:63-77`).
   There is no calendar-selection UI yet, so nothing is lost today, but any future selection
   would have been wiped on every navigation.
5. **A separate N+1 in the notes list.** Each `NotesItem` card issues its own
   `calendar_events` query for the linked event (`useNotesItem.fetchLinkedEvent`). That is
   N × notes, not N × accounts, so it is out of scope for #31 and listed under follow-ups.

## 2. Request math

N = connected Google accounts, C = selected calendars per account. Counts are browser-side
HTTP requests; the server-side Google API cost is shown separately.

### Before (`main`)

| Interaction | Browser requests | Google API (server) |
|---|---|---|
| Open `/app/calendar` (first time) | accounts 1 + prefs 1 + internal 1 + per account (refresh 1 + list 1 + db 1 + refresh 1 + sync 1 + db 1) + mount range (N + 1) = **4 + 7N** | N × (1 + C) |
| Dashboard ↔ calendar navigation | same as above (nothing is cached): **4 + 7N** | N × (1 + C) |
| Click an event on the dashboard (query-only) | full pipeline again: **3 + 7N** + sidebar 2 | N × (1 + C) |
| Change calendar view / date | **N + 1** | 0 |
| Create / edit / delete an event | **N + 1** (+ navigation guard on calendar) | 0 |
| Manual refresh button | 1 + 6N + (N + 1) = **2 + 7N** | N × (1 + C) |
| Open `/app` dashboard | middleware (3 + 6N) + load (N + 1 events, unbounded) + notes | N × (1 + C) |

For N = 3, C = 2: **25 requests** and **9 Google API calls** to open the calendar, and the
same again every time the user switches between the two app pages or clicks an event on the
dashboard.

### After (`reduce-api-usage`)

| Interaction | Browser requests | Google API (server) |
|---|---|---|
| Open `/app/calendar` (first time in session) | accounts 1 + prefs 1 + per account (list 1 + sync 1) + 1 range query = **3 + 2N** | N × (1 + C) |
| Dashboard ↔ calendar within 5 min | **1** (single range query on mount) | 0 |
| Dashboard ↔ calendar after 5 min | 1 + N sync (background) + 1 reload = **2 + N** | N × C |
| Click an event on the dashboard (query-only) | **0** + sidebar 2 | 0 |
| Change calendar view / date | **1** | 0 |
| Create / edit / delete an event | **1** | 0 |
| Manual refresh button | 2N + 1 = **1 + 2N** | N × (1 + C) |
| Open `/app` dashboard | **1** (week range) + notes once | 0 (sync TTL) |

For N = 3, C = 2: **9 requests** on first open, then **1** per page interaction. Token refresh
calls drop from ~2 rotations per navigation to zero on a healthy session.

What is still proportional to N: the first sync of a session (N `list-calendars` + N
`sync-events`) and the manual refresh. Removing that needs the backend changes in §4.

## 3. What this branch changes

Client only — no edge function deploy and no migration required.

- **Session cache for accounts and preferences.** `fetchConnectedAccounts()` is a no-op after
  the first call (`accountsLoaded`); the settings page passes `{ force: true }` because it is
  the editor. Preferences load once. Both caches are dropped on `SIGNED_OUT` so a second
  sign-in on the same tab cannot see the previous user's data.
- **Sync TTL.** `syncAllAccounts()` only calls `google-sync-events` for accounts whose last
  sync is older than `SYNC_TTL_MS` (5 min) and shares one in-flight promise across callers.
  `google-list-calendars` runs once per session per account (the list rarely changes) or on a
  forced refresh. A successful sync bumps `syncVersion`; the calendar and dashboard watch it
  and reload their own range in place.
- **One query per view.** `useCalendar.loadEventsInRange(range)` reads `calendar_events` for the
  user and range in a single request and splits rows by source with `groupEventsBySource`
  (`internal_<userId>` / google account id). Replaces `loadEventsFromDb` (per account) and
  `useInternalEvents.loadEvents`. The dashboard now asks for the current week instead of the
  whole table.
- **Query-only navigation never hits the network.** The middleware returns early for
  `to.path === from.path` once accounts are loaded, on both pages.
- **`getSession()` instead of `refreshSession()`** for edge-function calls.
- **`console.log` of accounts and events removed** (security audit finding 7, same lines).

Pure logic is unit-tested: `tests/unit/google-calendar-sync.spec.ts` (TTL / stale selection)
and `tests/unit/calendar-events-grouping.spec.ts` (grouping). Composables depend on Nuxt
auto-imports and are covered by typecheck and a manual run.

## 4. Follow-ups (backend, separate PRs)

1. **Batch sync endpoint.** Let `google-sync-events` accept `{ googleAccountIds?: string[] }`
   (default: all accounts of the caller, resolved through the user client so the IDOR from
   the security audit closes at the same time) and list calendars itself when an account has
   no `google_calendars` rows. First open of a session becomes **1** edge call regardless of N.
2. **Incremental sync.** Store Google's `nextSyncToken` per `(account, calendar)` and send
   `syncToken` + `showDeleted=true` on later calls. Server-side cost becomes O(changes) and
   deleted events finally get marked `cancelled` (see `feature-plan-calendar-ux-and-landing.md`,
   Milestone 1).
3. **Move sync off the client.** A scheduled function (every 5–10 min for active users) plus
   Google push notifications (`events.watch`) keep `calendar_events` fresh server-side. The
   client then only reads the DB and can subscribe to `calendar_events` through Supabase
   Realtime. Client Google-related requests per session: **0**.
4. **Notes list N+1.** Select `notes` with an embedded `calendar_events(title, start_at)` in
   `useNotes.refreshNotes` and drop `useNotesItem.fetchLinkedEvent`.
5. **Security audit finding 4.** Revoke `access_token` / `refresh_token` from `authenticated`
   and select explicit columns in `fetchConnectedAccounts`.
6. **`google-list-calendars` should not overwrite `selected`** once a selection UI exists
   (upsert only `summary`, `description`, `time_zone`, `is_primary`, `updated_at`).
