# Amplitude Integration Spec

## Goal

Add product analytics to Planify using Amplitude's free **Starter** plan so we can measure feature usage, retention, and funnel drop-off — without paying anything for the diploma timeline.

## Why Amplitude (free tier fits)

- **10K MTUs** and **2M events/month** ceiling — Planify will not approach either as a student project.
- **Session replay** included free (with PII masking) — useful for defending UX claims at diploma defense.
- **Unlimited team seats** — both founders + examiners can have read access.
- **1-year retention** — covers the entire diploma window.
- No commercial-use restriction; the only real obligation is a privacy notice if we track non-author users.

## Non-goals

- No A/B testing (Amplitude experimentation is gated above free).
- No server-side event ingest from Supabase Edge Functions — client-only is enough.
- No reverse-ETL into Supabase — we only push analytics out, never pull it back into product logic.

## Stack & SDK choice

- **`@amplitude/analytics-browser`** — official browser SDK. Lightweight, framework-agnostic, works with Nuxt 4 SSR-off setup.
- **`@amplitude/session-replay-browser`** — optional, added in Phase 5.
- No Vue/Nuxt-specific wrapper exists from Amplitude — we wrap manually via a Nuxt plugin + composable. Pattern matches `auth-listener.client.ts`.

## File placement (FSD)

Analytics is cross-cutting and depends on nothing app-specific, so it sits in `shared`:

```
app/
  plugins/
    amplitude.client.ts          ← init + provide
  shared/
    analytics/
      index.ts                   ← public exports
      events.ts                  ← typed event catalog (const enum + property types)
      use-analytics.ts           ← composable: track / identify / reset / setUserProperties
      types.ts                   ← AnalyticsEvent, EventProperties, UserProperties
```

Path alias `@shared/analytics` is already covered by the existing `@shared` alias in `nuxt.config.ts`.

## Environment

Add to `.env` (and `.env.example` if it exists; create if not):

```
NUXT_PUBLIC_AMPLITUDE_API_KEY=
```

Wire into `runtimeConfig.public` in `nuxt.config.ts`:

```ts
runtimeConfig: {
  public: {
    // ...existing
    amplitudeApiKey: process.env.NUXT_PUBLIC_AMPLITUDE_API_KEY,
  },
}
```

If the key is missing in any environment, the plugin should **no-op silently** (don't throw — local dev without analytics must still work).

## Phase 1 — Bootstrap

**Outcome:** SDK initialized in the browser; one test event visible in the Amplitude dashboard.

1. `pnpm add @amplitude/analytics-browser`
2. Create `app/plugins/amplitude.client.ts`:
   - Read `useRuntimeConfig().public.amplitudeApiKey`.
   - If empty → return early (no-op).
   - Call `amplitude.init(apiKey, undefined, { defaultTracking: { sessions: true, pageViews: true, attribution: true, fileDownloads: false, formInteractions: false } })`.
   - Provide via `return { provide: { amplitude } }` so `useNuxtApp().$amplitude` works.
3. Manual verification: open the app in dev, confirm `Page Viewed` event arrives in Amplitude **Live View** within ~30s.

**Definition of done:** Amplitude Live View shows pageview events from local dev within seconds of navigation.

## Phase 2 — Auth identification

**Outcome:** Each user is identified by their Supabase user ID; logout resets the Amplitude identity.

1. Extend `app/plugins/auth-listener.client.ts` (do **not** create a second listener — keep Supabase events in one place):
   - On `SIGNED_IN` / session restored → `amplitude.setUserId(user.id)` and call `setUserProperties({ signup_method, email_domain })`.
   - On `SIGNED_OUT` → `amplitude.reset()` (clears device ID + user ID — new anonymous identity).
2. `email_domain` derived from `user.email.split('@')[1]` — never push the raw email (PII minimization).
3. Add helpers in `use-analytics.ts`: `identify(userId, props)`, `resetIdentity()`.

**Definition of done:** Logging in with two different accounts in the same browser shows two distinct user IDs in Amplitude, and logging out then logging in as user B does not merge user B's session into user A's history.

## Phase 3 — Event catalog & instrumentation

**Outcome:** Type-safe event tracking wired into the features we care about.

`shared/analytics/events.ts` exports a `const` map and a discriminated-union type so `track('event_created', { … })` only accepts the right properties.

### Event catalog v1

| Event | Properties | Where it fires |
| --- | --- | --- |
| `signup_completed` | `method: 'email' \| 'google'` | `features/auth/composables/signup`, `google-auth` |
| `login_completed` | `method: 'email' \| 'google'` | `features/auth/composables/login`, `google-auth` |
| `password_reset_requested` | — | `forgot-password` composable |
| `event_created` | `source: 'drag' \| 'modal' \| 'sidebar'`, `has_note: boolean`, `duration_minutes: number` | EventFormModal / calendar drag-create flow |
| `event_updated` | `fields_changed: string[]` | EventFormModal save (edit mode), drag/resize handlers |
| `event_deleted` | — | EventDetailsModal / sidebar delete |
| `calendar_view_changed` | `view: 'day' \| 'week' \| 'month'` | Schedule-X view toggle |
| `note_created` | `linked_to_event: boolean`, `length_chars: number` | NoteFormModal submit, EventFormModal note-binding flow |
| `note_updated` | `fields_changed: string[]` | NoteFormModal edit save |
| `note_deleted` | — | NoteSidebar delete |
| `integration_connected` | `provider: 'google'` | `features/integrations` connect flow |
| `theme_changed` | `theme: 'light' \| 'dark' \| 'system'` | `features/settings` theme toggle |

User properties set via `setUserProperties` on identify:

- `signup_method: 'email' \| 'google'`
- `email_domain: string`
- `signup_date: ISO string` (set once on first identify)
- `has_google_integration: boolean`

### Instrumentation rules

- **Always go through `useAnalytics()`** — never `useNuxtApp().$amplitude` from a feature. The composable is the single seam we can stub in tests.
- **Never block UI on `track`** — Amplitude's SDK is fire-and-forget by design; do not `await` it.
- **Never send PII** as event properties — no raw emails, no note bodies, no event titles. Lengths and counts are fine.
- **Group similar events** with the `source` property rather than minting `event_created_from_drag` / `event_created_from_modal` as separate events (keeps the catalog small, makes funnels easier).

**Definition of done:** Manually exercising signup → create event → add note → change view produces the expected event sequence in Amplitude Live View with correct properties.

## Phase 4 — Session replay (optional)

**Outcome:** Session replay enabled with aggressive PII masking, **off by default in dev**.

1. `pnpm add @amplitude/session-replay-browser`
2. In the plugin, after `init`, conditionally add the session-replay plugin only when `import.meta.env.PROD` (avoid local-dev recordings).
3. Mask everything sensitive by default — use the `block` selector for any element containing user content:
   - Add `data-amplitude-block` to: NoteForm content editor, EventFormModal title input, calendar event titles in the rendered grid, note titles, sidebar previews.
   - Configure `privacyConfig: { blockSelector: ['[data-amplitude-block]'], maskSelector: ['input', 'textarea'] }`.
4. Sample rate: start at `sampleRate: 0.1` (10% of sessions) to stay well under the free-tier replay quota.

**Definition of done:** Recorded sessions in Amplitude show wireframe placeholders (gray boxes) wherever user content lives, not the actual text.

## Phase 5 — Consent (EU jurisdiction)

**Outcome:** Analytics tracking is gated behind explicit user consent for new visitors; existing authenticated users are grandfathered with a one-time prompt.

1. Add a tiny `useAnalyticsConsent()` composable backed by `useLocalStorage` (already available via `@vueuse/core`):
   - States: `'pending' | 'granted' | 'denied'`.
   - Default: `'pending'`.
2. In the Amplitude plugin, **defer `init` until consent is granted**. If denied or pending, no SDK code loads beyond the wrapper.
3. Add a small banner component (`shared/ui/AnalyticsConsentBanner.vue`) shown when state is `'pending'` — two buttons: "Accept analytics" / "Decline".
4. On denial → call `amplitude.setOptOut(true)` defensively in case anything sneaks through.
5. Hook into `features/settings` so users can revoke consent later — adds `setting_changed` with `key: 'analytics_consent'` (only fired if consent is currently granted, otherwise we'd be tracking through opt-out).

**Definition of done:** A fresh browser profile sees the banner, denying it produces zero network traffic to `amplitude.com`, and the choice persists across reloads.

## Test plan

- **Unit:** Mock `$amplitude` in `useAnalytics` tests; assert `track` was called with the right event name and property shape (Zod schema match).
- **E2E (Playwright):** One smoke test per critical funnel — signup → first event created → first note created. Assert no console errors from the analytics plugin in any environment (including when API key is empty).
- **Manual:** Use Amplitude's **Live View** during each phase's verification step. Faster than dashboard queries.

## Rollout

1. Land Phase 1 + 2 behind a feature-flagless toggle (env var presence). Verify in staging.
2. Land Phase 3 incrementally — one feature area per PR (auth, calendar, notes, settings). Keeps diffs reviewable.
3. Land Phase 4 + 5 together — replay is meaningless without consent gating in EU jurisdiction.

## Open questions

- **Diploma split note:** Analytics is a CPO-relevant surface (the dashboards drive product decisions). Worth deciding whether the partner's standalone artifact gains read-only access to a curated Amplitude dashboard at defense time — adds narrative weight to their CPO framing without adding scope to either of our codebases.
- **Server-side events:** If Phase 3 in-app instrumentation misses Supabase-driven mutations (e.g. cascading deletes), we may want a thin Edge Function relay later — explicitly out of scope for v1.
