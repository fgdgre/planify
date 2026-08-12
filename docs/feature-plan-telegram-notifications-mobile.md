# Feature Plan: Telegram Bot, Notification Center, Mobile Version

> Status: PLAN (not started). Written 2026-07-03.
> Personal doc — docs/ is intentionally untracked, same as the other files here.
>
> Verdict up front: **all three are feasible with reliable effort.** Do them as three
> separate milestones in this order: **1) Notification Center → 2) Telegram Bot → 3) Mobile.**
> Reason: the notification center is the "sink" that the Telegram bot writes into, so
> building it first means the bot lands into ready infrastructure. Mobile is independent
> and the least deterministic, so it goes last.

---

## Grounding facts (verified in the codebase, 2026-07-03)

- Nuxt 4 SPA, statically generated (`nuxt generate`), deployed on Netlify → **there is no
  Node server**. Anything that needs a backend must be a **Supabase Edge Function**.
- Edge Function infrastructure already exists and works: `supabase/functions/google-oauth-start`,
  `google-oauth-callback`, `google-sync-events`, `google-list-calendars`, plus `_shared/cors.ts`.
  The Telegram webhook is the same pattern — no new hosting, no new deploy pipeline.
- `calendar_events` table already models external sources: `is_internal`,
  `external_event_id`, `google_account_id`, `html_link`, `synced_at`. A Telegram-created
  event fits this model with minimal schema change.
- Sidebar is store-driven: `app/entities/sidebar/stores/app-sidebar.ts` holds a
  `sections` array (name / pageName / icon / link). Adding a nav item is one entry;
  the badge needs a small component change in `AppSidebarLink.vue` / `AppSidebarContent.vue`.
- ⚠️ **Naming collision**: `app/features/notification` already exists — it is the
  **toast** system (`useNotification`, `notificationStore`, durations). The new feature
  must be a separate slice: use **`app/features/notification-center`**. Do not touch the
  toast slice.
- FSD layers in use: `shared → entities → features` (no widgets layer). Place new UI
  according to the `fsd-place` skill before creating files.

---

## Milestone 1 — Notification Center (~2–3 working sessions)

### 1.1 Database

New table `notifications`:

```sql
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,              -- 'event_created' | 'event_updated' | 'profile_updated' | ...
  source      text not null default 'app',-- 'app' | 'telegram' | 'google'
  title       text not null,
  body        text,
  entity_type text,                       -- 'calendar_event' | 'profile' | 'note'
  entity_id   uuid,                       -- e.g. calendar_events.id → build the open-link on FE
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc) where is_read = false;

alter table public.notifications enable row level security;
create policy "own notifications select" on public.notifications
  for select using (auth.uid() = user_id);
create policy "own notifications update" on public.notifications
  for update using (auth.uid() = user_id);  -- for mark-as-read
-- inserts come from triggers / edge functions (service role), no insert policy for users needed
```

After creating: `pnpm db:types` to regenerate `database.ts`.

### 1.2 Notification generation — use a Postgres trigger, not frontend calls

**Decision: DB trigger on `calendar_events`** (insert/update). Rationale: it automatically
covers ALL sources — UI-created events, Google sync, and the future Telegram bot — with
zero code in each producer. Frontend-side inserts would miss Google sync and require
remembering to call it from every mutation.

```sql
create or replace function public.notify_event_change() returns trigger as $$
begin
  insert into public.notifications (user_id, type, source, title, entity_type, entity_id)
  values (
    new.user_id,
    case when tg_op = 'INSERT' then 'event_created' else 'event_updated' end,
    case
      when new.google_account_id is not null then 'google'
      when new.external_event_id like 'tg_%' then 'telegram'   -- convention set in Milestone 2
      else 'app'
    end,
    coalesce(new.title, 'Untitled event'),
    'calendar_event',
    new.id
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger calendar_events_notify
  after insert or update of title, start_at, end_at on public.calendar_events
  for each row execute function public.notify_event_change();
```

Profile changes: same pattern, a small trigger on `profiles` for `event = 'profile_updated'`.

**Bulk-sync suppression (✅ DECIDED 2026-07-03: yes, suppress):**
`google-sync-events` sets a transaction-local flag before its bulk upsert; the trigger
checks it and skips inserting notifications:

```sql
-- in the edge function, same connection/transaction as the upsert:
select set_config('app.suppress_notifications', 'true', true);  -- 'true' = local to tx
-- in notify_event_change(), first line:
if current_setting('app.suppress_notifications', true) = 'true' then return new; end if;
```

### 1.2b Notification preferences (✅ ADDED 2026-07-03, user request)

Users pick which notifications they receive, managed in a new **Settings section**.

- Table `notification_preferences`: `user_id uuid pk references profiles`,
  one boolean per type — `event_created`, `event_updated`, `profile_updated`,
  `telegram_events` — all `default true`, plus `updated_at`. RLS: own-row select/update/insert.
- Enforce **in the trigger** (single choke point, covers all producers):

```sql
-- in notify_event_change(), after the suppress check:
if exists (
  select 1 from public.notification_preferences p
  where p.user_id = new.user_id
    and case
      when tg_op = 'INSERT' then p.event_created = false
      else p.event_updated = false
    end
) then return new; end if;
```

  (No prefs row = defaults = everything on.)
- Frontend: new "Notifications" card in `app/pages/app/settings.vue` following the
  existing settings-section pattern — toggle per type, optimistic update, composable
  `useNotificationPreferences` in the `notification-center` slice.
- Keep the type list small (the 4 above). Per-source granularity only if a real need shows up.

### 1.3 Frontend (FSD placement)

- `app/features/notification-center/`
  - `types/index.ts` — `AppNotification` type from `Tables<'notifications'>`
  - `composables/useNotifications.ts` — fetch list (paginated, newest first), `markAsRead`,
    `markAllAsRead`
  - `stores/notificationCenterStore.ts` — unread count + realtime subscription:
    `supabase.channel(...).on('postgres_changes', { event: 'INSERT', table: 'notifications', filter: user_id=eq.${uid} }, ...)`
    (enable Realtime for the table in Supabase dashboard). Realtime makes the badge live —
    good demo material; polling fallback is acceptable if Realtime misbehaves.
  - `components/NotificationCard.vue` — card: title, body, source chip, relative time,
    link to entity (`/app/calendar?event=<id>` or existing event-open mechanism), unread dot.
    **Telegram-sourced cards get a distinct highlight** (accent border + telegram icon).
- `app/pages/app/notifications.vue` — the page: `flex flex-col gap-*` list of cards,
  filter tabs optional (All / Unread), "mark all read" button.
- Routes: add `ROUTES.NOTIFICATIONS` in `@shared/constants/routes`.
- Sidebar: add section entry in `app-sidebar.ts` (icon `lucide:bell`); render unread-count
  badge in the sidebar link component fed by the store (cap display at "9+").

### 1.4 Definition of done

- New event from UI, from Google sync, and (later) from Telegram each produce one card.
- Badge updates without page refresh (realtime) and clears when read.
- RLS verified: user A cannot read user B's notifications.
- Unit tests for the composable; typecheck clean.

---

## Milestone 2 — Telegram Bot → events (~2–4 working sessions)

### 2.1 Architecture

```
Telegram user ──▶ Telegram Bot API ──webhook──▶ Supabase Edge Function `telegram-webhook`
                                                    │ 1. verify secret token header
                                                    │ 2. resolve chat_id → user_id (telegram_links)
                                                    │ 3. parse message → event fields
                                                    │ 4. insert into calendar_events (service role)
                                                    │      external_event_id = 'tg_<message_id>'
                                                    │      is_internal = false
                                                    │ 5. reply to user with confirmation/error
                                                    └──▶ notifications row appears via M1 trigger (free)
```

- Create the bot with @BotFather (free), `setWebhook` to the function URL with
  `secret_token`; the function must check the `X-Telegram-Bot-Api-Secret-Token` header.
- Secrets via `supabase secrets set TELEGRAM_BOT_TOKEN=...` — same pattern as Google creds.

### 2.2 Account linking (required — the bot must know which Planify user writes)

New table `telegram_links` (user_id PK/unique, chat_id unique, telegram_username,
linked_at) + short-lived `link_token`. Flow:

1. Settings page (Integrations section already exists) → "Connect Telegram" button →
   FE generates a row with random `link_token`, shows deep link `https://t.me/<bot>?start=<token>`.
2. User taps it; bot receives `/start <token>`; webhook function matches the token,
   stores `chat_id`, confirms: "Linked to <email>".
3. Settings shows linked status + "Disconnect". Mirrors the existing Google-accounts UX.

### 2.3 Parsing — **AI-only via Gemini Flash free tier** (✅ DECIDED 2026-07-03)

Decision: skip the template grammar; every non-command message goes to **Gemini Flash
(free tier)** for structured extraction. Zero cost, one code path, full natural-language
UX from day one ("зустріч з Іваном завтра о 15" just works).

Implementation:
- `GEMINI_API_KEY` via `supabase secrets set` (free key from Google AI Studio).
- Call the Gemini API with `responseMimeType: "application/json"` + `responseSchema`
  (Gemini's structured-output mode) targeting:
  `{ title: string, start_at: iso8601, end_at: iso8601 | null, all_day: boolean, location: string | null }`.
- Prompt must inject: current datetime, user timezone (store an optional tz on
  `telegram_links`, default Europe/Kyiv), and instruction to answer in the message's
  language for the confirmation echo.
- **Validate the model output with zod before any DB write.** On validation failure or
  API error/rate limit: bot replies "couldn't parse, try like: 'Meeting with John
  tomorrow 15:00'" — never insert garbage.
- Default `end_at = start_at + 1h` when the model returns null and `all_day` is false.
- Free-tier rate limits (~10–15 req/min) are far above coursework traffic, but handle
  429 with the friendly-error reply, not a retry loop.
- Test set: keep ~20–30 sample messages (UA + EN, dates in different formats) as a
  fixture; run them through the parser and record accuracy — ready-made thesis table.

Commands stay deterministic (not AI): `/start <token>` linking, `/help`, `/unlink`.

### 2.4 Event insert details

- Insert with service-role client, `user_id` from the link, `is_internal = false`,
  `external_event_id = 'tg_<chat_id>_<message_id>'` (idempotency: unique check prevents
  double-insert on Telegram webhook retries).
- The M1 trigger creates the notification automatically with `source = 'telegram'` —
  which drives the highlighted card. No extra code.
- Bot replies: success → "✅ Created: <title>, <formatted date>" (+ link to the app);
  parse failure → usage help; unlinked chat → link instructions.

### 2.5 Definition of done

- `/add` template message creates a real event visible in the calendar and a highlighted
  telegram notification card.
- Webhook retries don't duplicate events; secret-token check rejects forged requests.
- Unlink works; messages from unlinked chats never touch the DB.
- Unit tests for the template parser (the date grammar especially).

---

## Milestone 3 — Mobile version (~3–5 working sessions, least deterministic)

Do this last and **page by page**, not big-bang. Tailwind is already in place, so this is
breakpoint work, not a rewrite.

1. **Audit pass first** (0.5 session): open every page at 375px, screenshot, list breakages.
   Deliverable: a checklist in this doc.
2. **App shell**: sidebar → off-canvas drawer below `md:` (collapsed state already exists
   in the store — extend it: on mobile, `isSidebarCollapsed` becomes a hidden/overlay
   drawer + hamburger in a top bar).
3. **Calendar page**: Schedule-X ships mobile-friendly views — force day/agenda view below
   a breakpoint via its config rather than trying to shrink week view. EventSidebar →
   full-screen overlay / bottom sheet on mobile.
4. **Notes, Dashboard, Settings, Notifications**: mostly stacking (`grid-cols-1`),
   padding scale, and touch target sizes. The M1 notifications page should be written
   mobile-first from day one so it needs nothing here.
5. **Auth pages**: two-column marketing layout → single column below `md:`.
6. Verification: Playwright viewport runs (375×812, 768×1024) + manual pass; add a
   smoke e2e per page at mobile viewport.

Risk concentration: Schedule-X calendar interactions (drag/resize on touch). If touch DnD
fights back, scope it out explicitly — "view + tap-to-open on mobile, editing via form"
is a defensible cut for a diploma.

---

## Decision points — ALL RESOLVED 2026-07-03 ✅

1. **Order**: Notification Center → Telegram → Mobile. ✅ Confirmed.
2. **AI tier**: ✅ AI-only parsing via **Gemini Flash free tier** (see §2.3). No template grammar.
3. **Google-sync notification spam**: ✅ Suppress via edge-function flag (see §1.2) **and**
   add per-type notification preferences in Settings (see §1.2b).
4. **Diploma split**: ✅ Milestone 2 (Telegram bot) is **attributed to the partner** as
   their diploma scope, but Dmytro implements it himself. Keep the bot's code isolated
   (own edge function, own tables) so it stays presentable as a standalone unit in the
   thesis defense.

The plan is decision-complete. Next session can start executing Milestone 1 directly.

## Suggested execution loop (when you return)

Per milestone: brainstorm the remaining decision points → `superpowers:writing-plans`
for a task-level plan → implement with TDD → `pnpm typecheck && pnpm test` →
vue-component-reviewer agent on the .vue diffs → commit.
