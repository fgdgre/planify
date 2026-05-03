---
name: fsd-place
description: Decide which Feature-Sliced Design layer a new file belongs in (shared / entities / features) and verify import direction. Use before creating any new file under app/, or when reviewing a PR that adds files, to keep cross-layer imports out of the codebase.
---

# Placing code in Planify's FSD layout

Planify uses a three-layer Feature-Sliced Design under `app/`. Aliases are defined in `nuxt.config.ts`: `@shared`, `@entities`, `@features`, `@assets`. Pages live in `app/pages/`, layouts in `app/layouts/`, route guards in `app/middleware/`.

## The layers

### `app/shared/` — framework-agnostic primitives, no domain knowledge

- `shared/ui/<component>/` — design-system components, prefixed `Supa*` (e.g. `SupaInput`, `SupaSplitSidebar`, `SupaDropdown`). Auto-registered globally via `nuxt.config.ts → components`.
- `shared/api/supabase/` — Supabase client, generated `types/database.ts`, query helpers.
- `shared/constants/` — `ROUTES`, `AUTH_VALIDATION_MESSAGES`, `public-routes.ts`. Anything referenced by 2+ features.
- `shared/types/` — cross-cutting TS types (`google.ts`, `user.ts`).
- `shared/variants/` — tailwind-variants tokens (`size.ts`).

A file belongs here if removing the project's domain (calendars, notes, auth) wouldn't change it.

### `app/entities/` — domain models the whole app shares

- `entities/calendar/` — calendar event types, `useCalendar`, `useInternalEvents`, calendar store, helpers, calendar-event display components.
- `entities/sidebar/` — `AppSidebar`, `useAppSidebar`, sidebar store.

Standard subfolders: `components/`, `composables/`, `stores/`, `types/`, `helpers/`.

A file belongs here if multiple features need it AND it represents a domain noun (an "event", a "sidebar"), not a user flow.

### `app/features/` — user-facing flows

- `features/auth/` — signup, login, logout, `useUserStore`, `useInitApp`.
- `features/notes/` — note CRUD, `NotesForm`, `useNotes`, note schemas.
- `features/integrations/google-calendar/` — Google OAuth + sync flow (composables, stores, components, types).
- `features/settings/` — user preferences, color picker, validation schemas.
- `features/notification/` — toast/notification system.
- `features/validation/` — `validateForm`, Zod-schema runner.

Standard subfolders: `components/`, `composables/`, `stores/`, `schemas/`, `types/`, `constants/`.

A file belongs here if it implements a verb the user does ("log in", "create a note", "connect Google Calendar").

## Import direction (strict)

```
pages / layouts / middleware
        ↓
     features
        ↓
     entities
        ↓
      shared
```

A layer may **only** import from itself or layers below it.

| From → To | Allowed? |
|---|---|
| `shared` → `entities` | ❌ never |
| `shared` → `features` | ❌ never |
| `entities` → `features` | ❌ never |
| `entities` → `shared` | ✅ |
| `features` → `entities` | ✅ |
| `features` → `shared` | ✅ |
| `features` → other `features` | ⚠️ avoid; usually means the shared bit belongs in `entities` or a feature should re-export through its public api |
| pages → anything below | ✅ |

If you find yourself wanting to import upward, the file is in the wrong layer — move it down.

## Public-api convention

Each slice has an `index.ts` barrel. Prefer `import { Note } from '@features/notes'` over deep paths like `@features/notes/types/note.ts` for everything intended to be consumed externally. Deep imports are fine *within* the same slice.

## Decision checklist (run this before `Write`)

1. **Does it know about a domain noun?** (calendar event, note, user, sidebar) — if no, it goes in `shared`.
2. **Is it a user flow / orchestration?** (signup, sync events, create note) — `features/<flow>/`.
3. **Is it a domain model used by 2+ features?** — `entities/<noun>/`.
4. **Which subfolder?** — match existing convention: `components/` (`.vue`), `composables/` (`use*.ts`), `stores/` (Pinia), `types/`, `schemas/` (Zod), `constants/`, `helpers/`.
5. **Pick the alias.** Always prefer `@shared/@entities/@features` over relative paths that cross slices.
6. **Sanity-check imports.** Open the new file's imports — every one must point to the same layer or below.

## Common mistakes seen in this repo

- Putting Google-Calendar-specific helpers in `entities/calendar/` because they touch events. Google-Calendar is a *feature* (an integration); only generic event types/composables belong in entities.
- Creating new `Supa*` components inside a feature folder. Reusable UI primitives belong in `shared/ui/`. If only one feature uses it, name it after the feature instead (e.g. `NotesForm.vue`) and keep it in `features/notes/components/`.
- Adding constants to a feature when they're referenced from `shared/ui` or another feature — promote to `shared/constants/`.
- Re-exporting `@shared` types from a feature's `index.ts`. Don't — consumers should import from `@shared` directly.
