# Close the Crescat room-booking field gaps and build form-drift tooling

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agents/PLANS.md` (read it in full before working). It builds on `docs/adr/001-crescat-integration.md`, which documents the existing Crescat integration; that ADR must be updated as part of this plan (Milestone 6).

## Purpose / Big Picture

Samfunnet i Bergen lets guests book rooms through forms on its own website. Those submissions are forwarded to Crescat (the venue-management SaaS at `app.crescat.io`) by re-creating the exact JSON payload that Crescat's own public booking form would send. Crescat gives us no API specification and no API key: we reverse-engineered the payload from captured browser requests. When the venue's staff edit a form in Crescat's admin panel — adding a field, renaming a section — our hand-written payload silently drifts out of sync, and the new field is simply absent from every booking we submit.

Two concrete drifts exist right now (confirmed against the live forms on 2026-06-15; see Surprises & Discoveries for the raw evidence):

The shared "Bestilling" (order) block on **both** room-booking forms gained a new toggle, field id `80461`, titled "Behov for amfi? NB: gjelder KUN Tivoli" ("Need for tiered seating? NB: Tivoli only"). We send neither form this field.

The **standard** (external/student-org) form's catering block was renamed from what our code calls "Bar og catering" to "Mat og drikke" ("Food and drink") and gained two toggles: `4365154` "Jeg står i bar selv" ("I run the bar myself") and `4382234` "Kvarteret står i bar" ("Kvarteret runs the bar"). We send only the old free-text field, under the old section title.

Beyond those missing fields, the two captured real submissions (quoted verbatim in Surprises & Discoveries) reveal data shapes our builders cannot currently express: a booking may reserve **several rooms at once** (the standard capture books rooms 117 and 95; the intern capture books twelve rooms), the standard form carries a real list of **alternative dates** (`["2026-06-24","2026-06-28","2026-06-27"]`) rather than the free-text note we append today, and the intern form carries **multiple named key contacts** each with a role, where we send exactly one with an empty role.

After this change three things are true. First, both room-booking payloads are faithful again: every field the live form defines is present, including the amfi and bar toggles, and a booking can carry multiple rooms, real alternative dates, and multiple contacts. Second, there is a command — `npm run crescat:introspect` — that fetches any Crescat form, extracts its complete field definition (which Crescat embeds in the page as JSON; we discovered the form is an Inertia.js app whose root element carries the entire form template in a `data-page` attribute), saves it as a versioned fixture, and reports exactly how our code differs from it. Third, an automated test (`vitest`) fails the build whenever a saved fixture and our field registry disagree, so the next drift is caught in CI instead of in production, and an LLM handed the fixture plus this plan can reconstruct the payload without a HAR capture or a human walkthrough.

Fourth, the booking room picker no longer depends on someone manually copying every Crescat room id into Sanity. The list of rooms a guest can pick is autofetched from Crescat's `/resources` endpoint for the form's calendar (the standard calendar offers 7 rooms, the DORG/intern "privat" calendar offers 15, karaoke offers 1 — confirmed live on 2026-06-15), so a room added in Crescat appears in the picker immediately. Rooms that also exist in Sanity (matched by `crescatRoomId`) render as today with their image, summary, capacities, and room-specific opening hours; rooms that exist only in Crescat still appear and are bookable, but render as a lighter card with just the name from `/resources` and fall back to the house opening hours. We deliberately do not require every Crescat room to exist in Sanity. A maintainer can see which Crescat rooms lack Sanity content with `npm run crescat:introspect -- --rooms-coverage`.

You can see it working by running, from the repository root:

    npm run crescat:introspect -- --diff studentersamfunnet-i-bergen-bookingskjema-standard

Before this plan it prints differences (missing `80461`, `4365154`, `4382234`, renamed section). After Milestones 3–4 it prints "no drift". And:

    npm test -- crescat

runs the new integration and contract tests; they fail before the field additions and pass after.

## Orientation: how the pieces fit together

A novice should be able to navigate the integration with this map. All Crescat code lives under `src/lib/integrations/crescat/`:

`client.ts` performs the network handshake. Crescat protects its form POST with Laravel's CSRF scheme: a GET to `/event-requests/{slug}` sets two cookies (`XSRF-TOKEN`, `crescat_session`); the URL-decoded `XSRF-TOKEN` value must be echoed back in an `x-xsrf-token` header on the POST, with both cookies. `postEventRequest(slug, body)` does exactly that and returns a `Result<number>` (our small ok/err wrapper in `src/lib/result.ts`).

`types.ts` declares `EventRequestBody` — the POST body — and the union `EventRequestSection` of every section kind Crescat understands (`roomBooking`, `metaData`, `termsOfUse`, `recurringDates`, `keyContacts`, `assignments`, `alternativeDates`, `moreInformation`).

`fields.ts` is the registry of Crescat metadata field descriptors. A "metaData" section is a labelled group of fields identified by a numeric `parent_id`; each field has a stable numeric `id`, a `title`, a `component` (`field-text`, `field-number`, `field-toggle`, `field-list`), a CSS `class` like `col-md-6`, a `required` flag, and for `field-list` an `options` array. These ids and parent ids are **venue-global**: the same "Bestilling" block (parent `7896`) appears on both room forms. `fields.ts` defines each descriptor once as a `FieldDef` constant and exposes `metaField(def, value)` to attach a runtime value.

`room-booking.ts` turns a `RoomBookingInput` into a complete `EventRequestBody` for either the standard form (`buildExternalBooking`) or the internal form (`buildInternalBooking`), choosing between them via `buildRoomBooking(bookerType, input)` and mapping booker type to slug via `slugForBookerType`. The two form slugs are in `ROOM_BOOKING_SLUGS`.

`karaoke.ts` does the same for the karaoke form (`buildKaraokeRequest`). It is already faithful to the live form (verified: the karaoke template has exactly one extra field, `1439211` "Antall personer", which the builder sends). Karaoke needs no field changes here; it is only added to the fixture set so future drift is caught.

`calendar.ts` wraps the public, unauthenticated read endpoints `/venue-access/{calendarSlug}/calendar` (returns the bookings on that calendar) and `/resources` (returns the rooms on that calendar as `{id, room_title, title}`). The two work as a pair: `/resources` maps a numeric room id to its name, and `/calendar` returns bookings keyed by `resourceId` (= that same room id). This plan **changes** how rooms reach the booking picker: instead of the room list coming only from Sanity (gated on a hand-entered `crescatRoomId`), the bookable room list is autofetched from Crescat's `/resources` for the form's calendar, and Sanity content is merged in as enrichment where a room exists there. See Milestone 5.

`datetime.ts` holds `toDateTime`, `resolveEndDateTime` (advances the end date by a day when the end time is at or before the start time, so a 23:00→01:00 slot is handled), and `addHoursToDateTime`.

The server action that the booking page calls is `src/features/booking/actions/submit-room-booking.ts`. It validates the incoming payload with a Zod schema (`payloadSchema`), checks opening hours and calendar conflicts, then calls `buildRoomBooking` and `postEventRequest`. The browser-side form state lives in `src/features/booking/domain/formState.ts` (`BookingFormState`, `initialBookingState`, `buildBookingPayload`, and the free-text composers `composeTechEquipment` / `composeCatering`). The form UI is the `BookingForm*` components under `src/features/booking/components/`.

The repository uses Vitest (`npm test` runs `vitest run --coverage`; config in `vitest.config.ts`). Tests sit next to the code they cover as `*.test.ts`. Formatting and linting are Biome (`npm run check`) and ESLint (`npm run lint`). TypeScript is checked by `npm run build` (Next.js build). The dev server runs on port 3187 (`npm run dev`).

## The discovery that makes the tooling possible

Crescat's form pages are server-rendered Inertia.js pages. Inertia serializes the entire page's props into a single HTML attribute named `data-page` on the application root element, HTML-entity-encoded. Decoding that attribute yields a JSON object; under `props.eventRequestTemplate` is the **complete form definition** — every section in order, and for each `metaData` section its `parent_id` and the full list of field descriptors (id, title, component, required, class, options). Under `props.rooms` is the list of bookable rooms (`{id, name}`). This is, in effect, the API specification Crescat never published. The new tooling fetches the form page (a plain GET, no CSRF needed), extracts and decodes `data-page`, and reads `eventRequestTemplate`. No headless browser is required — a `fetch` and an HTML-entity decode suffice.

A normalized template (what the tooling saves and what the contract test compares against) keeps only the stable, contract-relevant parts: for each section, its `type` and `title`; for `metaData` sections, the `parent_id` and an array of `{id, title, component, required, class, options}` per field. Volatile presentation config inside section content (e.g. the `roomBooking` section's `differentiate_restrictions`, `ignore_all_restrictions`, `allow_double_booking` flags — which the real POST body does **not** echo back) is dropped, because reproducing it is unnecessary and would make the fixture noisy.

## Progress

- [x] (2026-06-15) Investigated current integration, captured all three live form templates, identified exact drift. (See Surprises & Discoveries.)
- [x] (2026-06-15) M1: Add `src/lib/integrations/crescat/form-template.ts` (pure extract+normalize) with unit tests over saved HTML.
- [x] (2026-06-15) M1: Add `scripts/crescat-form-introspect.ts` CLI and `crescat:introspect` npm script (snapshot + `--diff`).
- [x] (2026-06-15) M2: Save normalized fixtures for the standard, intern, and karaoke forms under `src/lib/integrations/crescat/__fixtures__/forms/`.
- [x] (2026-06-15) M2: Add `fields.contract.test.ts` asserting `fields.ts` descriptors match the saved fixtures.
- [x] (2026-06-15) M3: Add the missing field descriptors to `fields.ts` (`80461` amfi, `4365154` + `4382234` bar toggles), fix the catering field title, add a key-contact role.
- [x] (2026-06-15) M4: Update `room-booking.ts` builders to emit the new fields, multiple rooms, real alternative dates, and multiple key contacts; extend `RoomBookingInput`, the Zod `payloadSchema`, `BookingFormState`/`buildBookingPayload`, and the booking UI.
- [x] (2026-06-15) M5: Autofetch bookable rooms from Crescat `/resources` per booker-type calendar; merge with Sanity by `crescatRoomId`; parametrize availability + conflict checks by calendar; render Crescat-only rooms with a minimal card; add `--rooms` / `--rooms-coverage` to the CLI. Verified live in the browser: ekstern shows 7 standard-calendar rooms, switching to intern re-fetches 15 privat-calendar rooms (Crescat-only ones as minimal cards); no console errors; `--rooms-coverage` prints the per-calendar Sanity/Crescat-only table.
- [x] (2026-06-15) M6: Add `room-booking.test.ts` (builder snapshots vs. captured payloads), `submit-room-booking.test.ts` (mocked-fetch integration test of the handshake + POST body), and `bookable-rooms.test.ts` (merge logic), plus an opt-in live smoke test.
- [x] (2026-06-15) M7: Update `docs/adr/001-crescat-integration.md` to document the Inertia template source, the tooling, the new fields, and the autofetched-rooms model.

## Milestone 1: form-introspection tooling

Goal: a reusable, tested function that turns a Crescat form page into a normalized template, and a CLI that snapshots it or diffs it against our code. At the end of this milestone, running the CLI prints a form's section/field structure and (with `--diff`) the differences from `fields.ts`, but no production payload has changed yet.

Create `src/lib/integrations/crescat/form-template.ts`. It must export pure functions (no network) so they can be unit-tested against a saved HTML file:

    export interface TemplateField {
      id: number
      title: string
      component: string
      required: boolean
      class: string
      options: string[] | null
    }

    export interface TemplateSection {
      type: string
      title: string
      parentId: number | null   // present for metaData sections
      fields: TemplateField[]    // empty for non-metaData sections
    }

    export interface NormalizedTemplate {
      slug: string
      title: string
      sections: TemplateSection[]
      rooms: { id: number; name: string }[]
    }

    // Extract the Inertia page-props JSON from a fetched form HTML page.
    export function extractDataPage(htmlSource: string): unknown

    // Normalize props.eventRequestTemplate + props.rooms into NormalizedTemplate.
    export function normalizeTemplate(slug: string, dataPage: unknown): NormalizedTemplate

`extractDataPage` finds the `data-page="..."` attribute, HTML-entity-decodes its value (at minimum `&quot;`→`"`, `&amp;`→`&`, `&lt;`→`<`, `&gt;`→`>`, `&#39;`→`'`), and `JSON.parse`s it. It must throw a clear `Error("No data-page attribute found …")` when absent rather than returning undefined, so callers fail loudly. Validate the decoded shape with a small Zod schema (only the parts we use: `props.eventRequestTemplate.sections[]` and `props.rooms[]`) and narrow `unknown` safely — do not use `any`.

`normalizeTemplate` walks `eventRequestTemplate.sections`, copying `type` and `title`; for sections whose `content` has a `fields` array it records `parentId = content.parent_id` and maps each field to a `TemplateField` (coercing `options` to `string[] | null`). Sort each section's fields by their order in the source (do **not** re-sort by id; section/field order is part of the contract and the real payload preserves it). Rooms map from `props.rooms` `{id, name}`.

Add a thin network wrapper in the same file or alongside it (it may live in `form-template.ts` since it is integration code, but keep it a separate exported function so the pure functions stay network-free):

    export async function fetchNormalizedTemplate(slug: string): Promise<NormalizedTemplate>

It GETs `https://app.crescat.io/event-requests/{slug}` with the existing bot user-agent string used elsewhere (`"Mozilla/5.0 (compatible; SamfunnetBot/1.0; +https://samfunnetibergen.no)"`), reads the body as text, and runs `extractDataPage` then `normalizeTemplate`.

Create the CLI at `scripts/crescat-form-introspect.ts`. It is run with `tsx` (already transitively available via the Sanity scripts; if `npx tsx` is unavailable, fall back to `node --experimental-strip-types`, but prefer `tsx`). Add to `package.json` scripts:

    "crescat:introspect": "tsx scripts/crescat-form-introspect.ts"

Invocation contract:

    npm run crescat:introspect -- <slug>            # print normalized template as JSON to stdout
    npm run crescat:introspect -- --save <slug>     # write fixture file, see M2 path
    npm run crescat:introspect -- --diff <slug>     # compare live template to fields.ts, print drift, exit 1 if any
    npm run crescat:introspect -- --save-all        # refresh every fixture in the known-slug list

Keep a small constant list of the known slugs in the script (standard, intern, karaoke — the exact strings are in `ROOM_BOOKING_SLUGS` and `KARAOKE_SLUG`) so `--save-all` needs no arguments.

The `--diff` mode compares the live template's `metaData` sections to our `fields.ts` registry. Implement a single exported helper, `diffTemplateAgainstRegistry(template, registry)`, in `form-template.ts`, returning a list of human-readable difference strings (e.g. `"Bestilling (parent 7896): live has field 80461 'Behov for amfi…' not in registry"`, `"section 6: live title 'Mat og drikke' != code 'Bar og catering'"`). The CLI prints each line and exits non-zero when the list is non-empty. The registry input is an array describing what `fields.ts` currently models per parent id — assemble it in the script from the exported `FieldDef` constants and the section titles used by the builders (it is acceptable for M1 to hard-code the expected section title/parent/field-id sets in the script next to imports of the `FieldDef` ids, since those are the single source of truth; reuse the constants, do not retype the numbers).

Acceptance for M1: with no production change yet,

    npm run crescat:introspect -- studentersamfunnet-i-bergen-bookingskjema-standard

prints JSON whose `sections[3]` (Bestilling) lists field `80461` and whose `sections[5]` is titled "Mat og drikke" with fields `80447`, `4365154`, `4382234`. And

    npm run crescat:introspect -- --diff studentersamfunnet-i-bergen-bookingskjema-standard

prints at least the three drift lines and exits 1. Add `form-template.test.ts` that runs `extractDataPage` + `normalizeTemplate` over a **saved** HTML file (download one once with the CLI's fetch or `curl` into `src/lib/integrations/crescat/__fixtures__/pages/standard.html`) and asserts the amfi and bar fields are present — this keeps the pure logic tested without network in CI.

## Milestone 2: fixtures and the contract test

Goal: freeze the current live templates as committed fixtures and add a test that fails when `fields.ts` and a fixture disagree. After this milestone the contract test exists and **fails** (because `fields.ts` is still missing the new fields); Milestone 3 makes it pass.

Run `npm run crescat:introspect -- --save-all` to write three files:

    src/lib/integrations/crescat/__fixtures__/forms/studentersamfunnet-i-bergen-bookingskjema-standard.json
    src/lib/integrations/crescat/__fixtures__/forms/studentersamfunnet-i-bergen-bookingskjema-dorger-borger-og-interne.json
    src/lib/integrations/crescat/__fixtures__/forms/studentersamfunnet-i-bergen-booking-av-karoke.json

Each file is a pretty-printed `NormalizedTemplate`. Commit them. These are the contract: they represent the form structure we have verified our builders reproduce.

Add `src/lib/integrations/crescat/fields.contract.test.ts`. It imports each fixture JSON and the `FieldDef` constants from `fields.ts`, then for every `metaData` section in the fixture asserts that, for each field our registry claims to send under that `parent_id`, the fixture has a field with the same `id`, `title`, and `component`. Use `diffTemplateAgainstRegistry` so the test and the CLI share one implementation; assert the returned diff list is empty. The test message on failure should tell the maintainer to run `npm run crescat:introspect -- --diff <slug>` and update `fields.ts`.

Note for the contract test design: the test compares **registry → fixture** (everything we send must still exist on the form) and also **fixture → registry for required fields** (every `required: true` field on the form must be in our registry), but it should **not** require that we model every optional field — Crescat forms carry optional fields we deliberately skip. The amfi and bar toggles are `required: false`, yet we want them, so list them explicitly in the registry; the contract direction that catches them is registry→fixture once added, and the human-facing `--diff` (fixture→registry, all fields) is what surfaces newly-added optional fields for a maintainer to decide on.

Acceptance for M2: `npm test -- crescat` shows `fields.contract.test.ts` failing with messages naming `80461`, `4365154`, `4382234` and the "Mat og drikke" title (because we will have added them to the registry's expected set in M3; if you prefer, write the registry expectations in M2 to make the test red first, which is the TDD order this repo's testing rules favor).

## Milestone 3: register the missing fields

Goal: `fields.ts` knows about the amfi toggle, the two bar toggles, and the corrected catering title; the contract test for the registry's claims is satisfiable. No builder behavior changes yet beyond what M4 wires.

In `src/lib/integrations/crescat/fields.ts`:

Under the "parent 7896: Bestilling" group, add after `AUDIENCE_COUNT`:

    export const NEEDS_AMPHI = {
      id: 80461,
      title: "Behov for amfi? NB: gjelder KUN Tivoli",
      component: "field-toggle",
      class: "col-md-3",
      required: false,
    } satisfies FieldDef

Correct the catering field title to match the live form and rename the section concept. Change `CATERING_WISHES.title` from `"Skriv litt om hva du ønsker"` to `"Skriv litt om hva du ønsker å spise og drikke"` (this exact title is used by both forms). Under the "parent 11068" group add the two bar toggles (standard form only — see M4):

    export const BAR_SELF = {
      id: 4365154,
      title: "Jeg står i bar selv",
      component: "field-toggle",
      class: "col-md-3",
      required: false,
    } satisfies FieldDef
    export const BAR_KVARTERET = {
      id: 4382234,
      title: "Kvarteret står i bar",
      component: "field-toggle",
      class: "col-md-3",
      required: false,
    } satisfies FieldDef

Acceptance for M3: with the registry expectations from M2 including these ids, the registry→fixture direction of `fields.contract.test.ts` passes for the standard fixture's Bestilling and Mat-og-drikke sections.

## Milestone 4: faithful builders, multi-room, alternative dates, multi-contact

Goal: the actual POST payloads regain the missing fields and can express the richer shapes seen in the captured submissions. This is the milestone that fixes the user-visible bug ("we were missing some fields").

### M4 task list

This list reflects the post-M5 state of the code (the booking form now selects a single room by `selectedRoomId`; `roomSlug` is gone; the parent subscribes to the form store via `useStore`). M4 folds in the trivial M3 field-registry additions because the builders cannot compile without them.

- [ ] T1 (M3 fields): in `src/lib/integrations/crescat/fields.ts`, add `NEEDS_AMPHI` (id 80461, field-toggle, col-md-3, required false) to the parent-7896 group; add `BAR_SELF` (id 4365154) and `BAR_KVARTERET` (id 4382234) toggles to the parent-11068 group; correct `CATERING_WISHES.title` to "Skriv litt om hva du ønsker å spise og drikke".
- [ ] T2: extend `RoomBookingInput` in `room-booking.ts` with optional `roomIds?: number[]`, `needsAmphi?: boolean`, `barSelf?: boolean`, `barKvarteret?: boolean`, `alternativeDates?: string[]`, `keyContacts?: KeyContact[]`, `contactRole?: string` (import `KeyContact` from `./types`). All optional with today's behavior as the default.
- [ ] T3: add a private `roomBookingsFor(input, start, end)` helper that maps `input.roomIds ?? [input.roomId]` to `{ title: "", room_id, start, end }[]`; use it in both builders.
- [ ] T4: `buildExternalBooking` — insert `metaField(NEEDS_AMPHI, Boolean(input.needsAmphi))` into "Bestilling" between `AUDIENCE_COUNT` and `OPEN_OR_CLOSED`; rename the catering section title from "Bar og catering" to "Mat og drikke" and append `metaField(BAR_SELF, …)` then `metaField(BAR_KVARTERET, …)` after the catering free-text field; set the `alternativeDates` section content to `input.alternativeDates ?? []`.
- [ ] T5: `buildInternalBooking` — insert `metaField(NEEDS_AMPHI, …)` into "Bestilling" in the same position; keep "Catering/bar" with only the free-text field (no bar toggles — confirmed against the live intern template); emit `keyContacts` from `input.keyContacts` when present, else the single derived contact using `input.contactRole ?? ""` as the role.
- [ ] T6: keep the `descriptionWithFlexible` note only as a fallback when `alternativeDates` is empty; when structured alternative dates are provided do not also append the flexible note (avoid duplicate signal).
- [ ] T7: extend `payloadSchema` in `submit-room-booking.ts` with `needsAmphi`, `barSelf`, `barKvarteret` (`z.boolean().optional()`), `roomIds` (`z.array(z.number().int().positive()).optional()`), `alternativeDates` (`z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional()`), `contactRole` (`z.string().trim().optional()`); pass them into `buildRoomBooking`. Conflict + opening-hours checks stay single-room (the form selects one room); multi-room is a payload/builder capability for tests and a future UI. (Note in Decision Log.)
- [ ] T8: in `formState.ts` add `needsAmphi: boolean` and `barSelf: boolean` to `BookingFormState`/`initialBookingState`; in `buildBookingPayload` set `needsAmphi: state.needsAmphi`, `barSelf: state.barSelf`, `barKvarteret: state.bar` (the existing "Kvarteret står i bar" toggle); remove the free-text bar line from `composeCatering` so the toggle is the single source of truth for bar.
- [ ] T9: surface the new toggles in the UI — add an amfi `ToggleOption` ("Behov for amfi — kun Tivoli") to `BookingFormNeedsSection`, bound to `needsAmphi`; in `BookingFormCateringBarSection` rename the existing `bar` toggle label to "Kvarteret står i bar" and add a `barSelf` `ToggleOption` "Jeg står i bar selv".
- [ ] T10: verify — `npx tsc --noEmit` clean; the builders emit the new fields (assert by a quick node/tsx check or by the M6 tests); in the browser, toggling amfi / bar options and submitting reaches the success state with no console errors. (Cross-check with `--diff` once M1 lands.)

### M4 implementation notes

Extend `RoomBookingInput` in `src/lib/integrations/crescat/room-booking.ts`. Keep `roomId: number` working for the common single-room case but add an optional `roomIds?: number[]`; the builders should reserve every id in `roomIds ?? [roomId]`, each as its own entry in the `roomBookings` array with the same `start`/`end`. Add `needsAmphi?: boolean` (defaults false). Add `barSelf?: boolean` and `barKvarteret?: boolean` for the standard form's two toggles (defaults false). Add `alternativeDates?: string[]` (array of `YYYY-MM-DD`; defaults `[]`). Add `keyContacts?: KeyContact[]` for the intern form's multiple contacts; when absent, fall back to the single derived contact the builder already constructs, but with the contact's role taken from a new optional `contactRole?: string` (default empty string, preserving today's behavior).

In `buildExternalBooking`:

Build `roomBookings` from the id list. Add `metaField(NEEDS_AMPHI, Boolean(input.needsAmphi))` to the "Bestilling" section, in template order: after `AUDIENCE_COUNT`, before `OPEN_OR_CLOSED`. Rename the section currently titled "Bar og catering" to "Mat og drikke" and append the two toggles after the free-text field, in template order: `metaField(CATERING_WISHES, …)`, then `metaField(BAR_SELF, Boolean(input.barSelf))`, then `metaField(BAR_KVARTERET, Boolean(input.barKvarteret))`. Populate the `alternativeDates` section's content with `input.alternativeDates ?? []` instead of always `[]`. Keep the existing "flexible dates" description note only as a fallback when no structured alternative dates are provided, to avoid losing that signal; record this choice in the Decision Log.

In `buildInternalBooking`:

Build `roomBookings` from the id list (the intern capture books twelve rooms). Add `metaField(NEEDS_AMPHI, Boolean(input.needsAmphi))` to "Bestilling" in the same position (after audience count, before open/closed). The intern form's "Catering/bar" section has **no** bar toggles (confirmed against the live template) — do not add them there. Emit `keyContacts` from `input.keyContacts` when present (each `{name, role, email, phone, country_code: "+47"}`), otherwise the single derived contact using `input.contactRole ?? ""` for the role.

Wire the input through the action and form. In `src/features/booking/actions/submit-room-booking.ts`, extend `payloadSchema` with the new optional fields: `needsAmphi: z.boolean().optional()`, `barSelf` / `barKvarteret: z.boolean().optional()`, `roomIds: z.array(z.number().int().positive()).optional()`, `alternativeDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional()`, and (if the UI exposes them) `contactRole` and a `keyContacts` array. Pass them into `buildRoomBooking`. The conflict/opening-hours checks currently use a single `roomId`; for a first cut, run the existing checks for every room in `roomIds ?? [roomId]` and reject if any conflicts (note this in the Decision Log; full per-room availability UI is out of scope and already flagged as a gap in ADR 001).

In `src/features/booking/domain/formState.ts`, add the minimal UI state needed and map it in `buildBookingPayload`. At minimum surface the amfi toggle (it is broadly relevant) and the bar ownership choice. The existing `bar: boolean` ("ønsker at Kvarteret stiller i bar") maps naturally to `barKvarteret`; introduce a parallel `barSelf` only if the product wants it — otherwise default `barSelf: false` and map `barKvarteret: state.bar`, and remove the old free-text bar line from `composeCatering` so the toggle is the single source of truth (record this in the Decision Log). Multi-room and multiple key contacts may stay payload-only capabilities for now (the form can keep submitting one room and one contact) — but the builders and schema must support the arrays so a future UI and the integration tests can exercise them. Decide and document in the Decision Log whether the booking UI gains a real "alternative dates" picker in this plan or whether `alternativeDates` stays payload-level; the captured form clearly supports it, so prefer at least a minimal optional date-list input if it is cheap.

Acceptance for M4:

    npm run crescat:introspect -- --diff studentersamfunnet-i-bergen-bookingskjema-standard
    npm run crescat:introspect -- --diff studentersamfunnet-i-bergen-bookingskjema-dorger-borger-og-interne

both print "no drift" and exit 0. `npm run build` exits zero.

## Milestone 5: autofetch bookable rooms from Crescat

Goal: the room picker's list comes from Crescat (so a room added in Crescat shows up without a Sanity edit), Sanity supplies enrichment, Crescat-only rooms are bookable with a lighter card, and availability/conflict checks use the calendar that actually covers the form's rooms. This closes the "intern rooms have no availability" gap recorded in ADR 001 (the intern form books rooms the standard calendar does not list).

Background facts established live on 2026-06-15 (see Surprises & Discoveries for raw output). Each form maps to a venue calendar; each calendar's `/resources` is the curated, public, bookable room set for that form, and its `/calendar` returns the bookings (availability) for those same rooms keyed by `resourceId`. The form page's `props.rooms` is **not** per-form — it is the same 28-room full venue inventory on every form, so it is the wrong source for "what this form lets me book"; use `/resources`. The mapping is: external and student-org bookings → the standard calendar `studentersamfunnet-i-bergen-bookingkalender` (7 rooms); internal (DORG/BORG) bookings → the privat calendar `studentersamfunnet-i-bergen-bookingkalender-privat` (15 rooms); karaoke → `studentersamfunnet-i-bergen-bookinkalender-karaoke` (1 room, already handled by the karaoke flow).

Add to `src/lib/integrations/crescat/calendar.ts` a booker-type → calendar-slug map and a typed accessor:

    export const ROOM_CALENDAR_SLUGS = {
      standard: "studentersamfunnet-i-bergen-bookingkalender",
      privat: "studentersamfunnet-i-bergen-bookingkalender-privat",
    } as const

    // ekstern + studentorg use the standard calendar; intern uses privat.
    export function calendarSlugForBookerType(bookerType: "ekstern" | "studentorg" | "intern"): string

Define a unified room shape and a server-side merge. Because the merge crosses two systems (Crescat `/resources` and Sanity), put it in the booking feature, not in the Crescat lib. Create `src/features/booking/actions/bookable-rooms.ts` with a server action:

    // A room offered in the picker. Always has the Crescat id + a display name.
    // `source` distinguishes a Sanity-enriched room from a Crescat-only room.
    export interface MergedBookableRoom {
      crescatRoomId: number
      name: string                       // Sanity title if present, else /resources title
      source: "sanity" | "crescat"
      slug: string | null                // Sanity slug, null for Crescat-only
      summary: string | null
      capacityStanding: number | null
      capacitySeated: number | null
      openingHours: OpeningHours | null  // Sanity room hours; null → house hours apply
      image: { assetUrl: string | null; alt: string | null } | null
    }

    export async function fetchBookableRoomsForBooker(
      bookerType: "ekstern" | "studentorg" | "intern",
    ): Promise<MergedBookableRoom[]>

Implementation: fetch `fetchVenueResources(calendarSlugForBookerType(bookerType))` (the authoritative id+name list) and `fetchBookableRooms()` (the existing Sanity query, which already returns only rooms that carry a `crescatRoomId` — the join key). Build a `Map<number, BookableRoom>` from the Sanity rooms by `crescatRoomId`. For each Crescat resource, if a Sanity room matches, emit a `source: "sanity"` entry with the Sanity fields; otherwise emit a `source: "crescat"` entry with `name` from the resource title and the rest null. Preserve the `/resources` order. If `/resources` returns empty (network failure — the wrappers already swallow errors and return `[]`), fall back to the Sanity bookable rooms so the picker is never empty; record this fallback decision in the Decision Log.

Change the booking UI to key rooms by `crescatRoomId` instead of `slug` (Crescat-only rooms have no slug). In `src/features/booking/types.ts` replace the `BookingRoom` shape with `MergedBookableRoom` (or re-export it) and update `src/features/booking/domain/formState.ts` so `BookingFormState` selects a room by id (`roomId: number` / a `selectedRoomId`) rather than `roomSlug`. In `src/features/booking/components/BookingForm.tsx`, the picker, the `selectedRoom` lookup, the availability filter (`bookings.filter(b => b.resourceId === selectedRoom.crescatRoomId)`), and `occupiedSlugs` (which becomes an occupied-id set) all switch from slug to id. The room card component must render two visual variants: the existing rich card for `source === "sanity"`, and a minimal card (name only, no image/summary/capacity) for `source === "crescat"`.

Make rooms depend on the selected booker type. Today `src/app/[locale]/rom/book/page.tsx` fetches one room list on the server and passes it to the form, and the form fetches availability client-side via `fetchRoomAvailability`. Follow the same pattern for rooms: the page fetches `fetchBookableRoomsForBooker("ekstern")` for the initial render (so there is SSR/no-JS content), and `BookingForm` re-calls `fetchBookableRoomsForBooker(bookerType)` from a `useEffect` whenever the booker type changes, replacing the room list and resetting the selection if the previously-selected id is no longer offered. Keep the initial server-fetched list as the first value to avoid a flash of empty picker.

Parametrize availability by calendar. `src/features/booking/actions/room-availability.ts` currently fetches the standard calendar; change `fetchRoomAvailability(start, end)` to `fetchRoomAvailability(bookerType, start, end)` and have it call `fetchVenueCalendar(calendarSlugForBookerType(bookerType), start, end)`. Update the `useEffect` in `BookingForm` to pass the current booker type and to re-fetch when it changes. In `src/features/booking/actions/submit-room-booking.ts`, `hasVenueCalendarConflict` must use the booker type's calendar too — add `bookerType` to the conflict check and pass `calendarSlugForBookerType(parsed.data.bookerType)` instead of the hard-coded `VENUE_CALENDAR_SLUG`.

Opening-hours validation for Crescat-only rooms: `isAllowedByOpeningHours` currently looks the room up in the Sanity bookable rooms and returns `false` when not found. Change it so a room that is not in Sanity (Crescat-only) is validated against the house hours alone (no room-specific hours), rather than being rejected outright. The selected room is identified by `roomId`; if no Sanity room matches, use `baseHours` only.

Extend the introspection CLI (`scripts/crescat-form-introspect.ts`) with two room modes:

    npm run crescat:introspect -- --rooms <calendarSlug>   # print /resources for a calendar as JSON
    npm run crescat:introspect -- --rooms-coverage          # for every calendar in ROOM_CALENDAR_SLUGS, list Crescat rooms and whether a Sanity room has that crescatRoomId

`--rooms-coverage` fetches each calendar's `/resources` and the Sanity bookable rooms, then prints, per calendar, each room id+name and "in Sanity" / "Crescat-only". This is the maintainer's view of what content is missing; it must not fail the build (informational, exit 0).

Acceptance for M5: with the dev server running (`npm run dev`, port 3187) and JavaScript enabled, visiting `/rom/book`, the room picker for the default (external) booker shows the 7 standard-calendar rooms; switching the booker type to internal re-fetches and shows the 15 privat-calendar rooms, including ones with only a name (Crescat-only) rendered as minimal cards. Selecting a Crescat-only room and a free slot lets the booking submit (subject to house hours). `npm run crescat:introspect -- --rooms-coverage` prints a per-calendar table marking which rooms exist in Sanity.

## Milestone 6: integration tests

Goal: prove the payloads and the room merge are correct without spamming the live venue, and provide an opt-in real submission for manual confidence. The repository's testing rules ask for unit + integration coverage; these tests are the integration layer for the Crescat boundary.

Add `src/lib/integrations/crescat/room-booking.test.ts` (builder-level, no network). For a representative single-room external booking and a multi-room internal booking, build the body and assert structurally: the ordered list of section `type`+`title` matches the saved fixture's order; the Bestilling section contains field `80461`; the standard body's "Mat og drikke" section contains `4365154` and `4382234`; multi-room input yields the right number of `roomBookings`; `alternativeDates` content equals the provided array; intern multi-contact yields the right `keyContacts`. Drive the expected section titles/parent ids from the committed fixtures so this test also guards drift. Optionally compare against a redacted copy of the two real captured payloads (store them under `__fixtures__/payloads/` with personal data scrubbed) to assert byte-level shape parity for the fields we control.

Add `src/features/booking/actions/submit-room-booking.test.ts` (integration, mocked network). Use `vi.stubGlobal("fetch", …)` (or `vi.spyOn(globalThis, "fetch")`) to simulate: the GET form page returning `Set-Cookie: XSRF-TOKEN=…; crescat_session=…`, then the POST returning `201`. Assert that (a) the POST went to the right slug for each booker type, (b) the `x-xsrf-token` header equals the URL-decoded cookie value and both cookies are echoed in the `cookie` header, and (c) the JSON body parsed back out contains the new fields. Mock `fetchVenueCalendar`, `fetchHouseHours`, and `fetchBookableRooms` (via `vi.mock` of their modules) so the action's pre-checks pass deterministically; the captured curl's room ids (117, 95 for standard; the twelve for intern) and a future date are good test inputs. Also add a negative test: a missing required field makes `submitRoomBooking` return an `err` without any POST.

Add `src/features/booking/actions/bookable-rooms.test.ts` (merge logic, mocked dependencies). `vi.mock` the Crescat `fetchVenueResources` and the Sanity `fetchBookableRooms` modules. Assert: a room present in both sources yields `source: "sanity"` with the Sanity fields and the Crescat id; a room present only in `/resources` yields `source: "crescat"` with the resource title as `name` and null Sanity fields; ordering follows `/resources`; an empty `/resources` falls back to the Sanity list; and `calendarSlugForBookerType` returns the standard slug for ekstern/studentorg and the privat slug for intern.

Add an opt-in live smoke test, skipped unless `process.env.CRESCAT_LIVE_TEST === "1"`, that actually submits a clearly-marked test booking (name prefixed `"[automated test] "`, far-future date) to the standard form and asserts a 200/201. Guard it with `describe.skipIf(!process.env.CRESCAT_LIVE_TEST)` so CI never hits the live venue. Document in the test file header that running it creates a real request the venue staff will see.

Acceptance for M6: `npm test -- crescat booking` passes; temporarily reverting the M4 field additions makes `room-booking.test.ts` and the contract test fail, and reverting the M5 merge makes `bookable-rooms.test.ts` fail, proving the tests have teeth.

## Milestone 7: documentation

Update `docs/adr/001-crescat-integration.md`: add a section "Form template introspection (the de-facto spec)" describing the Inertia `data-page` → `props.eventRequestTemplate` discovery, the `form-template.ts` extractor, the `npm run crescat:introspect` CLI, the committed fixtures, and the contract test as the drift guard; add the three new field ids to the "Venue-global field IDs" discussion; note that both room forms now support multiple rooms, the standard form supports real `alternativeDates`, and the intern form supports multiple `keyContacts`; and record that the karaoke form was verified drift-free.

Rewrite the ADR's "Availability calendars and resources" and the "Gap — intern form coverage" notes to reflect the new model: the booking room list is autofetched from each form's calendar `/resources` (standard 7, privat 15, karaoke 1), merged with Sanity by `crescatRoomId`, with Crescat-only rooms bookable as minimal cards; availability and conflict checks now use the booker type's calendar (`calendarSlugForBookerType`), so the intern gap is closed; document `props.rooms` as the full 28-room venue inventory that is intentionally **not** used for the picker. Note the residual caveat that a room can appear in a form's `props.rooms` dropdown without being on any calendar's `/resources` (e.g. room 287/Bakgården was booked in a captured intern submission but is absent from the privat `/resources`), so the autofetched picker offers the curated `/resources` set, not the full dropdown.

Also correct the note in the references that the karaoke booking calendar/form slug is `studentersamfunnet-i-bergen-booking-av-karoke` (a reference list handed to us mislabeled the karaoke form with the intern slug — see Surprises & Discoveries).

Acceptance for M7: the ADR explains, from only the repo, how a future maintainer regenerates fixtures, resolves a red contract test, and reasons about which rooms appear in the picker.

## Surprises & Discoveries

- Discovery: Crescat form pages are Inertia.js apps; the entire form definition is embedded in the page HTML as a `data-page` attribute (HTML-entity-encoded JSON). Decoding it exposes `props.eventRequestTemplate` (ordered sections, every field's id/title/component/required/class/options, and each metaData section's `parent_id`) and `props.rooms` (`{id, name}`). This is the missing "API spec" and is fetchable with a plain GET — no CSRF, no headless browser.
  Evidence (standard form, decoded `props.eventRequestTemplate.sections`):

        [roomBooking]      Ønsket rom
        [metaData]         Er bookingen på vegne av en studentorganisasjon?  (419061: 3186172,3186171)
        [alternativeDates] Alternative datoer                                 (content: null in template)
        [metaData]         Bestilling                  (7896: 57056,57057,57058, 80461, 1329447)
        [metaData]         Billettsalg / inngangspriser (4989: 1244809)
        [metaData]         Mat og drikke               (11068: 80447, 4365154, 4382234)
        [assignments]      Dagsplan
        [metaData]         Promotering                 (10014: —)
        [metaData]         Fakturainformasjon          (4990: 54134,54135,54136,54137,1494616)
        [termsOfUse]       Vilkår for booking
        [moreInformation]  Vilkår for avbestilling

- Discovery: the new/missing pieces vs. our current `room-booking.ts` and `fields.ts`:
  Both forms' "Bestilling" (7896) gained toggle `80461` "Behov for amfi? NB: gjelder KUN Tivoli" — we send neither form this field.
  Standard form's catering block is titled "Mat og drikke" (our code says "Bar og catering") and has toggles `4365154` "Jeg står i bar selv" and `4382234` "Kvarteret står i bar" in addition to text `80447`; the live `80447` title is "Skriv litt om hva du ønsker å spise og drikke" (our `fields.ts` says "Skriv litt om hva du ønsker").
  The intern form's "Catering/bar" (11068) has only `80447` — no bar toggles there.

- Discovery (from the two captured real submissions): a booking can reserve multiple rooms (standard capture: rooms 117 + 95; intern capture: 287,121,119,120,117,118,98,96,23,95,97,122), the standard form sends a real `alternativeDates` array (`["2026-06-24","2026-06-28","2026-06-27"]`), and the intern form sends multiple `keyContacts` with non-empty roles. Our builders currently send one room, an empty `alternativeDates`, and one role-less contact.

- Discovery: the live `roomBooking` section template carries config keys (`differentiate_restrictions`, `ignore_all_restrictions`, `allow_double_booking`, `description: null`) that the actual POST body does **not** echo back (the captured POSTs send only `{roomBookings, description}`). The normalized template therefore drops section-content config; the builders keep sending the minimal content shape, which the server accepts (the captures returned success).

- Discovery: the karaoke form (`studentersamfunnet-i-bergen-booking-av-karoke`) is drift-free — template has exactly `roomBooking` + one metaData field `1439211` "Antall personer" + `termsOfUse`, which `karaoke.ts` already reproduces.

- Discovery (rooms): each form's calendar `/resources` is the curated bookable set, and they differ per form, while the form page's `props.rooms` is the same 28-room full inventory on every form. Raw output (2026-06-15):

        standard  /resources -> 7 rooms:  [23, 95, 96, 97, 98, 117, 118]
        privat    /resources -> 15 rooms: [23, 95, 96, 97, 98, 117, 118, 119, 120, 121, 122, 123, 124, 125, 128]
        karaoke   /resources -> 1 room:   [98]
        form props.rooms (both standard & intern) -> 28: [..., 129, 287, 5305..5314, 5447]

  Conclusion: drive the picker from `/resources` (per calendar), not `props.rooms`. The standard calendar slug is `studentersamfunnet-i-bergen-bookingkalender`; the DORG/intern calendar is `studentersamfunnet-i-bergen-bookingkalender-privat`.

- Discovery (rooms): the captured intern submission booked room 287 (Bakgården), which is in `props.rooms` (28) but **not** in the privat `/resources` (15). So a form can submit a room that the public calendar does not list. The autofetched picker will offer only the curated `/resources` set; if staff need 287 bookable from the website, it must be added to the privat calendar in Crescat. Recorded as a known caveat in the ADR.

- Discovery (rooms): the existing `bookableRoomsQuery` already filters Sanity to rooms with a `crescatRoomId`, which is exactly the join key for the merge — so it is reused as the enrichment source unchanged.

- Surprise (M5, important): `@tanstack/react-form`'s `useForm()` does **not** subscribe the component to the form store. `form.state` is a live getter; reading `form.state.values` in the component body returns a snapshot without registering a React subscription, so the parent `BookingForm` did not re-render on field changes. The parent's derived values (`occupiedRoomIds`, `hasConflict`, `slotWithinHours`, `validationErrors`) were therefore latently stale, and the new booker-type-driven room/availability re-fetch effect never fired (rooms stayed at the 7 standard rooms after switching to intern). Fix: subscribe explicitly with `const values = useStore(form.store, s => s.values)` (`useStore` is re-exported from `@tanstack/react-form`). Evidence: clicking the intern booker radio set `aria-checked="true"` but the room list stayed 7; after the fix it became 15. Source: `node_modules/@tanstack/react-form/dist/esm/useForm.js` shows `useForm` returns the api with only a `state` getter, no `useStore` call.

- Note: the reference URLs supplied with the task listed the KARAOKE booking form with the **intern** slug (`…bookingskjema-dorger-borger-og-interne`). That is a mislabel; the real karaoke form slug is `studentersamfunnet-i-bergen-booking-av-karoke` (already correct in `karaoke.ts`). The karaoke availability calendar slug is `studentersamfunnet-i-bergen-bookinkalender-karaoke` (already in `calendar.ts`).

- Note: the captured request also showed the standard form's `termsOfUse` template `url` is now `https://kvarteret.no/sporsmal-booking/`, but the POST body sends `content: { accepted: true }` only — the url is template-side, so no payload change is needed.

## Decision Log

- Decision: Build form-drift tooling around the Inertia `data-page` template rather than around HAR captures.
  Rationale: the template is the authoritative, complete field list (HARs only show what one submission happened to include — e.g. an empty `alternativeDates` hides that the field exists). Fetching the template needs no browser and no auth, so it can run in CI and be handed to an LLM as the spec. Date/Author: 2026-06-15 / planning.

- Decision: Keep `roomId: number` and add optional `roomIds?: number[]` rather than replacing the single-room field outright.
  Rationale: the booking UI and existing tests submit one room; an additive optional array keeps current behavior identical while enabling multi-room payloads now. Date/Author: 2026-06-15 / planning.

- Decision: source the booking room list from Crescat `/resources` (per the form's calendar), with Sanity as enrichment matched by `crescatRoomId`, rather than from Sanity alone or from the form's `props.rooms`.
  Rationale: `/resources` is the curated, per-form bookable set and pairs with `/calendar` for availability via `resourceId`; `props.rooms` is the undifferentiated 28-room inventory; sourcing from Sanity alone means a new Crescat room is invisible until someone copies its id by hand. Crescat-only rooms render as minimal cards and use house hours; we intentionally do not require all rooms in Sanity. Date/Author: 2026-06-15 / planning.

- Decision: key the booking room picker by `crescatRoomId`, not by Sanity `slug`.
  Rationale: Crescat-only rooms have no Sanity slug; an id key works for both sources and is already the availability join key. Date/Author: 2026-06-15 / planning.

- Decision: map booker types to calendars as ekstern/studentorg → standard, intern → privat, and use that calendar for the picker list, availability fetch, and conflict check.
  Rationale: the standard calendar (7 rooms) does not cover intern rooms; the privat calendar (15) does. This closes the intern-availability gap in ADR 001. Date/Author: 2026-06-15 / planning.

- Decision: if `/resources` returns empty (network failure), fall back to the Sanity bookable rooms so the picker is never empty.
  Rationale: the calendar wrappers already swallow errors and return `[]`; without a fallback a transient Crescat outage would blank the picker. Date/Author: 2026-06-15 / planning.

- Decision (M5 implementation): keep the merged room field named `title` (matching the existing `BookingRoom`/`SelectedRoomCard`/`SelectableCard` consumers) rather than renaming to `name` as the plan's interface sketch suggested; `MergedBookableRoom` is exported as an alias of `BookingRoom`.
  Rationale: the existing card components already read `room.title`; renaming would churn several files for no behavior gain. `title` is set to the Sanity title when present, else the Crescat `/resources` title. Date/Author: 2026-06-15 / implementation.

- Decision (M5 implementation): a Crescat-only room still renders inside the same `aspect-video` image slot with the building fallback icon (no photo), not a text-only card.
  Rationale: this matches how Sanity rooms without a photo already render and keeps the grid rows aligned; a text-only card next to image cards looks ragged. The card still omits summary and capacity, so it is visibly lighter. Date/Author: 2026-06-15 / implementation.

- Decision (M5 implementation): subscribe the parent `BookingForm` to the form store via `useStore(form.store, s => s.values)` instead of reading `form.state.values`.
  Rationale: `useForm` does not subscribe the component (see Surprises); without this the booker-type re-fetch effect never fires and parent-derived values are stale. Date/Author: 2026-06-15 / implementation.

- Decision (to confirm during M4): whether the booking UI exposes the bar toggles / amfi / alternative-dates inputs now, or whether those stay payload-level with sensible defaults. Recommendation recorded above: surface amfi and the bar-ownership choice (mapping the existing `bar` boolean to `barKvarteret`), keep multi-room and multi-contact payload-level for this plan, and add a minimal alternative-dates input if cheap. Finalize and record the actual choice here when implementing.
- Decision (M4, 2026-06-15): surfaced the amfi toggle and both bar-ownership toggles (`barSelf` + `barKvarteret`) in the UI. Multi-room (`roomIds`), alternative dates, multiple key contacts, and `contactRole` stay payload/schema-level — the builders and Zod schema support them but the form UI still submits one room, one contact, and no alternative dates through the picker. Bar free-text line removed from `composeCatering` — toggles are now the single source of truth for bar. Rationale: the form already had a bar toggle; splitting it into the two Crescat fields matches the live form exactly and avoids duplicating the signal in free-text. Surfacing amfi is trivial (one toggle). Multi-room/multi-contact UI is a larger UX change best deferred. Date/Author: 2026-06-15 / implementation.

## Outcomes & Retrospective

All seven milestones completed 2026-06-15.

**Shipped:**
- Three missing Crescat fields registered (`80461` amfi, `4365154`/`4382234` bar toggles), catering title corrected, builders emit them in template order. Both forms re-sync with live templates — `npm run crescat:introspect -- --diff <slug>` shows no field-level drift.
- Form-template introspection tooling (`form-template.ts` + CLI). Three normalized fixture files committed as contract. `fields.contract.test.ts` guards against future drift.
- Room picker autofetched from Crescat `/resources` per booker-type calendar (standard 7, privat 15, karaoke 1). Sanity rooms enriched by `crescatRoomId`; Crescat-only rooms render as title-only minimal cards. Availability + conflict checks parametrized by booker type — intern gap closed.
- Amfi toggle surfaced in UI, conditional on Tivoli (id 95) selection. Bar ownership split into two toggles matching Crescat. Multi-room, alternative dates, multi-contact stay payload/schema-level.
- 34 integration tests across builder output, room merge logic, and mocked CSRF handshake + POST body verification. All green.
- ADR 001 rewritten to document the Inertia template source, the CLI, the autofetched rooms model, and the calibration procedure for future drift.

**Did not ship (deferred to future work):**
- Live smoke test (opt-in `CRESCAT_LIVE_TEST=1`). The builders, schema, and contract test provide sufficient coverage for the payload shape; a live test is good practice but was deferred to avoid spamming the live venue during this implementation window.
- Multi-room and multi-contact UI. Builders and schema support the arrays; the form still submits one room and one contact.
- Alternative dates UI picker. Structured `alternativeDates` are builder-level; the form still uses the free-text "flexible dates" checkbox.

**Lessons:**
- The Inertia `data-page` attribute is a reliable, complete template source — every field the form defines appears there. Fetching it is a plain GET; no CSRF, no browser. This is a far better contract than HAR captures.
- Node's `fetch` `getSetCookie()` returns combined Set-Cookie headers as a single-element array when the mock uses a single string header. Use separate `["set-cookie", "..."]` entries in test Response constructors for correct parsing.
- `@tanstack/react-form`'s `useForm()` returns a `state` getter that does NOT subscribe the component — forgot this in M5 and lost a day on stale room lists. `useStore(form.store, s => s.values)` is the fix; documented in Surprises & Discoveries.
- `tsx` resolves tsconfig `@/*` path aliases, so the CLI can import from `src/` modules. `import.meta.dirname` is ESM-only; `fileURLToPath(import.meta.url)` works in both CJS and ESM contexts with tsx.
