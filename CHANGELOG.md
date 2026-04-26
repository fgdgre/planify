# Change Log

## 2026-04-26

### Notes Sidebar
The notes experience was moved from the old modal-style flow into a dedicated route-driven sidebar. The sidebar now opens from query parameters and stays mounted in the app layout so the user can move between note views without losing context. The key route contract is `noteId` for view/edit and `noteAction=create` for new notes.

The note sidebar logic was extracted into `app/features/notes/composables/note-sidebar.ts`. That composable now owns:
- route parsing and sidebar open/close state
- note fetch by id
- linked event fetch by calendar event id
- create/update submit logic
- localStorage draft persistence
- cleanup when the sidebar closes or submit succeeds

The note editor itself now behaves like a real form surface instead of a read-only detail view. The title and content fields are editable by default, and the linked event panel remains part of the same sidebar instead of jumping to another overlay. The linked event section supports selecting, changing, discarding, and removing the linked calendar event, which keeps the note and event relationship explicit.

Notes list items were also cleaned up:
- item-specific logic was extracted into `app/features/notes/composables/notes-item.ts`
- note card dates were normalized into the formatted display date used by the list
- clicking a note now opens the note sidebar directly from the list

### Calendar Event Sidebar
Calendar events were moved to the same route-driven pattern. The event sidebar now responds to `eventId` for view/edit and `action=create` for creation. The create flow still supports prefilled start/end/all-day data from the calendar interaction, but the sidebar itself owns the draft, validation, and submit lifecycle.

The event sidebar logic was extracted into `app/entities/calendar/composables/event-sidebar.ts`. That composable now handles:
- route parsing and mode detection
- loading an event by id
- loading notes linked to that event
- create/update/delete event actions
- draft persistence for event fields
- separate draft persistence for the note section
- cleanup of query params and draft state on close

The event experience changed in two important ways. First, the note part no longer opens a second global sidebar on top of the event sidebar. Instead, it uses `eventNoteId` and stays inside the same event sidebar shell. That removes the flicker and the loading jump that happened when the note sidebar mounted separately. Second, edit mode now supports editing an already linked note in place, instead of only letting the user create an additional note.

The event sidebar now supports three clear states:
- view event only
- view event with a linked note expanded inside the same sidebar
- edit event with an editable note section

The create-event-with-note flow was preserved, because it was the one case where the “event first, note second” interaction made sense. In the updated implementation, the event form remains on the right and the larger note editor stays on the left when the note section is expanded.

### Shared Sidebar UI
A reusable split sidebar shell was added in `app/shared/ui/sidebar/SupaSplitSidebar.vue`. This component wraps `SupaSidebar` and standardizes the two-column layout used by both notes and calendar events. The goal was to stop repeating the same structural sidebar markup while still letting each feature own its own form logic.

The shared shell provides:
- a consistent right-side sidebar entry point
- a compact mode and an expanded split mode
- configurable title and subtitle content
- a shared footer area for submit/cancel actions
- a single place to control the width behavior

`SupaSidebar` itself was also updated to accept a `theme` prop with `white` and `black` variants. The new default is `white`, which gives the sidebar a normal light surface with dark foreground text, while `black` preserves the previous dark treatment when needed.

`TabDetails.vue` was adjusted so the note form can stretch naturally inside the larger left pane. That matters because both the note sidebar and the expanded event-note area need a taller editor region than the old compact form layout allowed.

### Routing And State Model
This pass moved both features to a more consistent query-param-driven state model instead of separate modal state. That means the URL now reflects what the user is looking at, and refreshes preserve the current context better.

The current route contract is:
- notes: `noteId`, `noteAction`
- calendar events: `eventId`, `action`, `eventNoteId`

The close handlers now strip stale query params, and submit success also clears the draft state in localStorage. This matters because the sidebars are now actual working surfaces, not transient popovers, so preserving and clearing state intentionally is important.

### Event Details
`EventDetailsPanel` was extracted as a reusable display component for event details. It now serves both event view mode and the note sidebar’s linked-event section.

The panel renders:
- event title
- time/date information
- location
- organizer or creator metadata
- description
- linked notes
- action buttons for internal events

Linked notes in the event details view are clickable, but they now stay inside the event sidebar instead of launching a separate note sidebar overlay. That was the main fix for the jumpy transition behavior.

### Draft Persistence
Draft persistence was made more explicit and feature-specific:
- note sidebar drafts are stored separately from event sidebar drafts
- event sidebar note drafts are stored separately from event form drafts
- note sidebar and event sidebar both clear their drafts on cancel and after successful submit
- the event sidebar keeps note draft data scoped to the selected linked note, so switching back and forth does not lose text

The effect is that accidental refreshes are less destructive, but the app still clears state when the user intentionally exits a flow.

### Verification
The new sidebar routes were checked successfully on the local Nuxt app during the implementation.

`pnpm typecheck` still fails, but only because of existing unrelated TypeScript issues elsewhere in the repo. The sidebar files touched in this pass did not introduce new typecheck errors in the last run.

---

## Bug Fixes & Polish — 2026-04-26 (afternoon)

### Sidebar Layout Width Parity
The `NoteSidebar` and `EventSidebar` used the same `SupaSplitSidebar` shell but rendered at different widths because `NoteSidebar` was missing the `context-width="520px"` prop. Both sidebars now explicitly pass `context-width="520px"` so the left context panel is consistent in width across both features.

### Note Panel Validation Fix (EventSidebar)
`validateNotePanel` in `event-sidebar.ts` had an early-return guard that checked `hasNoteInput` before running validation. This caused the validator to silently skip required field checks when the note panel was open but had not been touched yet. The guard was removed so validation always runs when the note panel is visible, regardless of whether the user has typed anything.

The submit button label logic in the same composable was also corrected so it reflects the correct action state (create vs. update) for the note section independently of the event form state.

### Inline Error Auto-Clear (EventSidebar + NoteSidebar)
Both sidebars now clear their inline field errors automatically when the user starts correcting them. Watchers were added to `event-sidebar.ts` for each validated field, and the same pattern was then applied to `note-sidebar.ts` to keep behaviour consistent. Previously, error messages stayed visible even after the user had fixed the input, which made the form feel broken.

### Note Panel Flash on Submit (EventSidebar)
When submitting a create or edit event that had the note section open, the note form would briefly collapse and re-expand during the transition — a visible flicker caused by the sidebar resetting `showNoteForm` to `false` before the new event's note state had loaded.

A `pendingNotePanel` ref was introduced in `useEventSidebar`. On submit, instead of immediately toggling the note panel off, the composable records the intended post-submit note state in `pendingNotePanel`. Once the sidebar has settled into its new state (new `eventId` resolved, event data loaded), the pending value is applied. This eliminates the flash without adding artificial delays.

### Sidebar Layout Shift on Submit
After submitting a calendar event that had the notes section open, the sidebar layout would shift or jump during the transition between create and view modes. The root cause was that the split-sidebar width was being recalculated while the note panel ref was in an intermediate state. The fix ensures the sidebar dimensions are stable during the submit transition by deferring the note panel state update through `pendingNotePanel`, keeping the visual layout locked until the new state is ready.

### Note Detail Blink on Open (CalendarEvent sidebar)
Opening a linked note's detail view inside the calendar event sidebar caused a visible blink — the note content would flash blank before rendering. This happened because the note was being fetched after the panel had already mounted and briefly shown empty state. The fetch is now triggered before the panel transitions to visible, so content is available on first paint.
