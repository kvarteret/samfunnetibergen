# Add a "Promotering" step to the room-booking form that can also publish an event

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agents/PLANS.md` (read it in full before working). It touches two existing feature areas — room booking (`src/features/booking/`) and event submission (`src/features/events/`) — and reuses the event-submission server actions and UI sections rather than duplicating them.

## Purpose / Big Picture

Samfunnet i Bergen has two separate public self-service flows today. One is **room booking**: a guest fills in the form at `/<locale>/rom/book` (file `src/app/[locale]/rom/book/page.tsx`) to request a room, and the request is forwarded to Crescat (the venue's booking SaaS). The other is **event submission** ("arrangement"): a guest fills in the form at `/<locale>/arrangementer/ny` (file `src/app/[locale]/arrangementer/ny/page.tsx`) to propose an event for the public events listing; that proposal is written to the Sanity CMS as an `arrangement` document with `approvalStatus: "pending"`, which the PR group later approves.

These two flows overlap heavily in practice: a person booking a room for a public event usually also wants that event promoted on the website. Today they must fill in both forms separately and re-type the same name, date, time and price. This change closes that gap.

After this change, the room-booking form gains a final step titled **Promotering** ("Promotion"). The guest must explicitly answer one required yes/no question: *"Vil du at vi skal promotere arrangementet på nettsiden?"* ("Do you want us to promote the event on the website?"). If they answer **Nei** ("No"), nothing else appears and the booking behaves exactly as it does today. If they answer **Ja** ("Yes"), an embedded event-promotion form appears inline, pre-filled from what they already typed into the booking (the event name, the start time, and whether it is free or paid). When they press the existing single submit button **Send bookingforespørsel**, two things now happen in sequence: the booking is sent to Crescat as before, and — only if they chose **Ja** and the booking succeeded — a pending `arrangement` is also created in Sanity, including an uploaded image if one was provided.

The guest can see it working by visiting `http://localhost:3187/no/rom/book`, scrolling to the new **Promotering** section at the bottom, choosing **Ja**, filling in the revealed fields, and submitting. A new `arrangement` document with `approvalStatus: "pending"` appears in the Sanity dataset (visible in Sanity Studio under pending events), and the booking is still forwarded to Crescat. Choosing **Nei** and submitting produces exactly today's behavior with no event created. Leaving the yes/no question unanswered blocks submission with the validation message *"Velg om du vil promotere arrangementet."* surfaced in the form's error summary.

Two product rules shape the event side specifically. First, **recurring events are not offered here** — the booking flow is for a single occasion, so the recurrence controls that exist in the standalone event form are hidden in this embedded copy. Second, **an image is optional but acknowledged**: the guest may upload an image, or they may tick a checkbox labelled *"Jeg laster opp bilde senere"* ("I will upload an image later"), accompanied by the explanatory note *"Arrangementer publiseres ikke før de har et bilde."* ("Events are not published until they have an image."). Submission is blocked only when neither an image nor the acknowledgement checkbox is present, so the guest is always made aware that a missing image delays publication.

## Orientation: how the pieces fit together

A novice should be able to navigate both feature areas with this map. Read it fully before editing; the plan refers back to these names.

### The room-booking form (what we are adding a step to)

`src/features/booking/components/BookingForm.tsx` is the top-level client component. It builds a form with TanStack React Form (`import { useForm, useStore } from "@tanstack/react-form"`). "TanStack React Form" is a form-state library; `useForm` returns a `form` object whose `form.state.values` holds the current field values, `form.setFieldValue(name, value)` updates one, and `form.Subscribe`/`form.Field` are render-prop components that re-render when selected values change. The form's initial values come from `initialBookingState` in `src/features/booking/domain/formState.ts`, whose type is `BookingFormState`. The booking form renders a vertical list of section components, each a `FormSection` (a presentational wrapper in `src/components/ui/form-section.tsx` that shows a two-digit step number and a title): `BookingFormBookerTypeSection`, `BookingFormScheduleSection`, `BookingFormEventDetailsSection`, `BookingFormTicketSection`, `BookingFormContactSection`, `BookingFormNeedsSection`, `BookingFormCateringBarSection`, and `BookingFormTermsSection`. After the sections it renders a honeypot input, an optional out-of-hours warning, the submit error, and the **Send bookingforespørsel** submit button.

The booking form computes its own validation synchronously on every render via the local function `getBookingValidationErrors(...)`, which returns an array of `ErrorSummaryItem` (`{ fieldId: string; message: string }`, from `src/components/ui/error-summary.tsx`). Those are fed to the hook `useFormErrors(validationErrors)` (`src/lib/use-form-errors.ts`), which returns `{ visibleErrors, markSubmitAttempt, errorFor }`. The pattern is: errors are computed always but only shown after the user attempts submit (`markSubmitAttempt()` is called in the `onSubmit` handler before `form.handleSubmit()`), and `errorFor(fieldId)` returns the message for a given field so a section can show it inline. The submit handler is on the `<form>` element: it calls `e.preventDefault()`, then `markSubmitAttempt()`, then `if (validationErrors.length > 0) return`, then `form.handleSubmit()`. The actual network submit lives in the `useForm({ onSubmit })` callback, which calls `submitRoomBooking(...)` (server action in `src/features/booking/actions/submit-room-booking.ts`) and throws on failure; TanStack stores the thrown error in `form.store`'s `errorMap.onSubmit`, and on success sets `isSubmitSuccessful`, which the component uses to render a success `Alert` instead of the form.

`BookingFormState` (in `src/features/booking/domain/formState.ts`) already contains the fields we will read for pre-fill: `eventName: string`, `startDate: string` (ISO `YYYY-MM-DD`), `startTime: string` (`HH:MM`), `endTime: string`, `doorsTime: string` (the "Dører åpner" / doors-open time, possibly empty), `freeOrPaid: "Gratis" | "Betalt"`, plus contact fields. The booking schedule UI that owns `doorsTime`, `startDate`, `startTime` is `src/features/booking/components/BookingFormScheduleSection.tsx`.

The booking page `src/app/[locale]/rom/book/page.tsx` is a server component. It fetches data with `Promise.all([...])` and passes it to `<BookingForm initialRooms openingHours closedDates initialRoomId />`. We will extend this `Promise.all` and pass three additional props.

### The event-submission form (what we are reusing)

`src/features/events/components/EventForm.tsx` is the standalone event form. Its form values type is `FormState` (in `src/features/events/domain/formState.ts`), seeded from `initialState`. Crucially, every event section component reads the form through a React context, not props: `src/features/events/components/eventFormContext.ts` exports `EventFormContext` (a `createContext<AppFormApi<FormState> | null>`) and the hook `useEventForm()`, which throws if used outside an `EventFormContext.Provider`. So any component wrapped in `<EventFormContext.Provider value={someForm}>` can call `useEventForm()` and drive `someForm`. This is the seam that lets us reuse the event sections inside the booking form without modifying them: we will create a *second* TanStack form in `BookingForm` and provide it through `EventFormContext.Provider`.

The reusable event section components, all under `src/features/events/components/`, are: `EventFormDetailsSection` (title, description, event-type `SelectField`, internal-event checkbox — props `uid`, `eventTypeOptions`, `titleError`, `titleId`), `EventFormImageSection` (image dropzone + preview — props `imagePreviewUrl`, `imageUploadError`, `onImageChange`, `onRemoveImage`), `EventFormScheduleSection` (one or more date cards + a recurrence checkbox/builder — props `uid`, `firstDateError`, `firstDateId`), `EventFormPlaceSection` (room `SelectField` + free-text place — props `uid`, `roomOptions`), `EventFormOrganizerSection` (organizer group combobox + free text — props `uid`, `groupOptions`), `EventFormPriceSection` (free checkbox + three price inputs — prop `uid`), `EventFormLinksSection` (ticket + Facebook URL — prop `uid`), and `EventFormSubmitterSection` (event contact name/email/organization — props `uid`, `submittedByError`, `submittedByErrorId`-style ids). The select option arrays (`eventTypeOptions`, `roomOptions`, `groupOptions`) are built in `EventForm` from data fetched server-side: `fetchEventRooms()`, `fetchEventTypes()`, `fetchEventGroups()` (all from `@/lib/sanity/fetch`, used today by `src/app/[locale]/arrangementer/ny/page.tsx`).

The event image handling currently lives inline inside `EventForm.tsx` as three pieces of local state (`imagePreviewUrl`, `imageFile`, `imageUploadError`) and two callbacks (`handleImageChange`, `handleRemoveImage`), which validate type and size using helpers from `src/features/events/domain/imageUpload.ts` (`isAcceptedEventImageType`, `EVENT_IMAGE_MAX_SIZE_BYTES`, `formatEventImageMaxSize`) and manage an object URL for preview (creating it with `URL.createObjectURL` and revoking it on change/unmount). We will extract this into a reusable hook so both forms share it.

The two server actions we reuse are both in `src/features/events/actions/submitEvent.ts` and are already `"use server"` exports: `uploadEventImage(formData: FormData): Promise<Result<string>>` uploads an image asset to Sanity and returns its asset id; `submitEvent(input: SubmitEventInput): Promise<Result<string>>` validates with the shared `getEventValidationIssues` (in `src/features/events/domain/validation.ts`) and writes the `arrangement` document, returning its id. `Result<T>` is the small `{ ok: true, value } | { ok: false, error }` wrapper from `src/lib/result.ts`. The standalone `EventForm.onSubmit` shows the exact call shape: build a `FormData` with the file, call `uploadEventImage`, take `uploadResult.value` as `imageAssetId`, then call `submitEvent({ title, description, dates, room, ..., imageAssetId, submittedBy, submittedByEmail, honeypot })`. We will reproduce that call shape from the booking submit path.

### Toolchain (commands a novice will run)

The repository uses npm. Tests are Vitest: `npm test` runs `vitest run --coverage`; test files sit next to code as `*.test.ts`. Linting is ESLint (`npm run lint`) and Biome formatting/checks (`npm run check`). TypeScript is type-checked as part of the Next.js production build (`npm run build`). The dev server runs on port 3187 (`npm run dev`), so the booking page is `http://localhost:3187/no/rom/book` (the default locale segment is `no`).

## Design decisions (the shape we are building)

These decisions were settled with the product owner before writing the plan; the Decision Log records them with rationale. They are stated here so the implementer does not re-litigate them.

The booking and the promotion event are submitted together by the **single existing submit button** ("one combined submit"). The booking is sent first; only if it succeeds is the event created. This keeps one button and one mental model for the guest.

The event collects its **own contact person** (the `EventFormSubmitterSection` is shown), rather than silently reusing the booking contact. This lets the promotion contact differ from the booking contact and keeps the reused section unmodified.

The pre-fill from booking into the event covers exactly three things: the event **title** from the booking's `eventName`; the event **start time** from the booking's `doorsTime` (the "Dører åpner" value) when set, otherwise offered via a **"Samme som booking"** ("Same as booking") button that copies the booking's `startTime`; and the event **free/paid** state (`isFree`) from the booking's `freeOrPaid`. The product owner did *not* request auto-filling the event date from the booking date, but the event requires at least one valid date to pass validation; to avoid presenting an empty required field we **default** the event's first date to the booking's `startDate` while leaving it fully editable. This default is a convenience, not a lock; see the Decision Log.

The optional event sections shown on **Ja** are: **Image + description/details** (`EventFormImageSection` + `EventFormDetailsSection`), **Type & taxonomy** (the event-type select inside `EventFormDetailsSection`), **Place & organizer** (`EventFormPlaceSection` + `EventFormOrganizerSection`), and **Price & links** (`EventFormPriceSection` + `EventFormLinksSection`), plus the event contact (`EventFormSubmitterSection`). Recurrence is hidden.

The image is optional but acknowledged: submission requires either an uploaded image file or a ticked "Jeg laster opp bilde senere" checkbox.

If the booking succeeds but the event creation fails (partial failure), the booking is **not** rolled back (we cannot un-send a Crescat request). The form shows the booking success state plus a non-blocking warning telling the guest the promotion could not be created and to contact `pr@kvarteret.no`. The event is the secondary, low-stakes action (a deletable pending draft), so this ordering minimizes harm.

## Plan of Work

The work proceeds in five milestones, each independently verifiable. Milestones 1 and 2 are additive refactors of the events feature that leave both existing forms behaving identically; Milestones 3–5 build the new behavior.

### Milestone 1 — Extract a reusable image-upload hook

Goal: stop the image-handling logic from being trapped inside `EventForm.tsx` so the booking form can reuse it verbatim, with no behavior change to the standalone event form.

Create `src/features/events/domain/useEventImage.ts` exporting a hook `useEventImage()` that owns the same three state values and two callbacks currently inline in `EventForm.tsx`. Its return type must be:

    export interface EventImageController {
      imageFile: File | null
      imagePreviewUrl: string | null
      imageUploadError: string
      onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
      onRemoveImage: () => void
      reset: () => void
    }

    export function useEventImage(): EventImageController

Move the existing `handleImageChange`/`handleRemoveImage` bodies and the `useEffect` that revokes the object URL on unmount into this hook unchanged (same validation via `isAcceptedEventImageType` and `EVENT_IMAGE_MAX_SIZE_BYTES`, same `URL.createObjectURL`/`revokeObjectURL` lifecycle). Add a `reset()` that clears file, preview (revoking the URL), and error. Then edit `src/features/events/components/EventForm.tsx` to replace its inline image state/callbacks with `const image = useEventImage()` and pass `image.imagePreviewUrl`, `image.imageUploadError`, `image.onImageChange`, `image.onRemoveImage` to `EventFormImageSection`, and use `image.imageFile` in `onSubmit`.

Acceptance: `npm run lint` and `npm run build` pass. Manually exercising `/no/arrangementer/ny` — choosing an image, seeing the preview, removing it, choosing a too-large or wrong-type file and seeing the existing error text — behaves exactly as before. No test previously covered this; behavior parity is verified by the build plus a manual check.

### Milestone 2 — Make the reused event sections accept the booking context's needs

Goal: add the two opt-in capabilities the embedded copy needs — hiding recurrence, and the "upload later" image acknowledgement — without changing the standalone event form's appearance. All new props are optional with defaults that preserve current behavior.

In `src/features/events/components/EventFormScheduleSection.tsx`, add an optional prop `allowRecurring?: boolean` defaulting to `true`. When `false`, do not render the `EventRecurrenceFields` block (the `form.Subscribe` on `isRecurring` and its checkbox/builder). The standalone `EventForm` does not pass the prop, so it keeps recurrence.

In `src/features/events/components/EventFormImageSection.tsx`, add optional props `uploadLater?: boolean` and `onUploadLaterChange?: (value: boolean) => void`. When `onUploadLaterChange` is provided, render below the dropzone a `CheckboxField` (from `src/components/ui/checkbox-field.tsx`) labelled "Jeg laster opp bilde senere" bound to `uploadLater`/`onUploadLaterChange`, and a `FieldHint` note "Arrangementer publiseres ikke før de har et bilde." When the prop is absent (the standalone form), nothing new renders. The existing `FieldHint` copy at the top of the section is unchanged.

Acceptance: `npm run lint` and `npm run build` pass. `/no/arrangementer/ny` is visually unchanged (no "upload later" checkbox, recurrence still present).

### Milestone 3 — A pure pre-fill mapping and a pure promotion-validation function, with tests

Goal: capture the booking→event pre-fill and the promotion gating rules as pure, unit-tested functions before wiring any UI, so the rules are provably correct independent of React.

Create `src/features/booking/domain/promotion.ts`. It must not import React. Define:

    import type { FormState as EventFormState } from "@/features/events/domain/formState"
    import type { BookingFormState } from "./formState"

    // Which booking fields seed the event form when the user opts in.
    export function buildPromotionDefaults(
      booking: Pick<BookingFormState, "eventName" | "startDate" | "startTime" | "doorsTime" | "freeOrPaid">,
      base: EventFormState,
    ): EventFormState

`buildPromotionDefaults` returns a copy of `base` (never mutates it) with: `title` set to `booking.eventName`; `isFree` set to `booking.freeOrPaid === "Gratis"`; and its first date entry's `startDate` set to `booking.startDate` and `startTime` set to `booking.doorsTime || booking.startTime`. (The first date entry is `base.dates[0]`; keep its `id`.) All other fields keep their `base` values.

Also define the "Samme som booking" helper and the validation:

    // The time to apply when the user clicks "Samme som booking".
    export function bookingStartTime(booking: Pick<BookingFormState, "startTime">): string

    export interface PromotionValidationInput {
      promote: BookingFormState["promote"]   // "" | "ja" | "nei"
      event: EventFormState
      hasImageFile: boolean
      uploadLater: boolean
    }

    // Returns user-facing messages (Norwegian) for everything wrong with the
    // promotion choice + event, or [] when the booking may proceed.
    export function getPromotionValidationMessages(input: PromotionValidationInput): { fieldId: string; message: string }[]

`getPromotionValidationMessages` rules: if `promote === ""`, return a single error for the yes/no field (message "Velg om du vil promotere arrangementet."). If `promote === "nei"`, return `[]`. If `promote === "ja"`, run the shared `getEventValidationIssues` (from `src/features/events/domain/validation.ts`) over the event values (mapping its `field` values to the booking field ids the section uses) and additionally require an image: if `!hasImageFile && !uploadLater`, push an error with message "Last opp et bilde, eller huk av for at du laster opp bilde senere." The `fieldId` strings are placeholders the caller will map to real DOM ids; define and export constants `PROMOTE_FIELD`, `PROMO_TITLE_FIELD`, `PROMO_FIRST_DATE_FIELD`, `PROMO_SUBMITTER_FIELD`, `PROMO_SUBMITTER_EMAIL_FIELD`, `PROMO_IMAGE_FIELD` so the test and the component agree.

Add `src/features/booking/domain/promotion.test.ts` (Vitest) covering: title/isFree/date/startTime pre-fill including the `doorsTime` precedence over `startTime`; `freeOrPaid: "Betalt"` yields `isFree: false`; `promote: ""` yields the choose-promotion error; `promote: "nei"` yields no errors regardless of event contents; `promote: "ja"` with an empty title yields the title error; `promote: "ja"` with a complete event but no image and `uploadLater: false` yields the image error; the same with `uploadLater: true` yields no image error; immutability (the `base`/`booking` inputs are unchanged after calling `buildPromotionDefaults`).

Acceptance: `npm test -- promotion` runs the new tests; they fail before `promotion.ts` exists (or with a stub) and pass after. Expect output similar to:

    ✓ src/features/booking/domain/promotion.test.ts (8)

### Milestone 4 — Add `promote` to booking state and render the Promotering section

Goal: surface the required yes/no question as the last booking section and, on **Ja**, render the embedded event form wired to a second TanStack form via `EventFormContext`. No event is submitted yet (that is Milestone 5); this milestone is about the UI appearing, pre-filling, and validating.

Edit `src/features/booking/domain/formState.ts`: add `promote: "" | "ja" | "nei"` to `BookingFormState` and set `promote: ""` in `initialBookingState`. Do not touch `buildBookingPayload` — `promote` is a website concern, never sent to Crescat.

Create `src/features/booking/components/BookingPromotionSection.tsx`. Its props:

    interface BookingPromotionSectionProps {
      promotionForm: AppFormApi<EventFormState>   // the second TanStack form, created in BookingForm
      eventTypeOptions: SelectOption[]
      roomOptions: SelectOption[]
      groupOptions: SelectOption[]
      image: EventImageController
      uploadLater: boolean
      onUploadLaterChange: (value: boolean) => void
      onSameAsBooking: () => void                 // sets the event's first date time to the booking start time
      showDoorsHint: boolean                      // true when doorsTime was used to prefill the start time
      promoteError?: string
      promoteFieldId: string
      // inline errors for the embedded event sections, mapped from the merged error list:
      titleError?: string
      titleId: string
      firstDateError?: string
      firstDateId: string
      submittedByError?: string
      submittedById: string
      submittedByEmailError?: string
      submittedByEmailId: string
    }

The section renders a `FormSection` titled "Promotering" with a step number consistent with the booking sequence (the booking sections currently number 01–02 explicitly and others implicitly; choose the next free two-digit number after the existing last section — verify the actual numbers in the section files when implementing and renumber consistently). Inside, render the required yes/no control. Implement it as a labelled pair of radio-style choice buttons (reuse the existing segmented pattern the booking form uses for `openOrClosed`/`freeOrPaid`; inspect `BookingFormEventDetailsSection.tsx` / `BookingFormTicketSection.tsx` for the exact component used and match it) bound to `promote` via the booking form. Show `promoteError` beneath it.

When `promote === "ja"`, render `<EventFormContext.Provider value={promotionForm}>` wrapping, in this visible order: `EventFormDetailsSection` (pass `eventTypeOptions`, `titleError`, `titleId`), `EventFormImageSection` (pass the `image` controller's `imagePreviewUrl`/`imageUploadError`/`onImageChange`/`onRemoveImage`, plus `uploadLater` and `onUploadLaterChange`), `EventFormScheduleSection` with `allowRecurring={false}` (pass `firstDateError`, `firstDateId`) and, directly under it, the **"Samme som booking"** button calling `onSameAsBooking` — show it only when `!showDoorsHint` (i.e. doors time was not available to prefill), and when `showDoorsHint` is true instead show a small hint "Starttid er hentet fra «Dører åpner»."; `EventFormPlaceSection` (`roomOptions`); `EventFormOrganizerSection` (`groupOptions`); `EventFormPriceSection`; `EventFormLinksSection`; `EventFormSubmitterSection` (event contact, with its error props). Because these nested sections also use `FormSection` with their own numbers 01–08, pass them a distinct sub-labeling so they do not read as top-level booking steps — set their `number` to a sub-scheme (e.g. empty or "P1"–"P8"); decide based on what `FormSection` accepts (check `src/components/ui/form-section.tsx`; if `number` is required and two-digit-only, relax it to accept any short string as part of this milestone, defaulting unchanged).

Edit `src/features/booking/components/BookingForm.tsx`:

Create the second form near the existing `useForm`: `const promotionForm = useForm({ defaultValues: initialState as EventFormState })` (import `initialState` and `FormState` from `@/features/events/domain/formState`). Create the image controller `const image = useEventImage()` and `const [uploadLater, setUploadLater] = useState(false)`.

Add pre-fill: in a `useEffect` keyed on the booking values that matter (`values.eventName`, `values.startDate`, `values.startTime`, `values.doorsTime`, `values.freeOrPaid`) and on `values.promote`, when `promote === "ja"`, push the pre-fill into `promotionForm` using `buildPromotionDefaults`. To avoid clobbering edits the user has already made in the event form, only seed a field when its current event value is still empty/default (e.g. set `title` only if `promotionForm.state.values.title === ""`; set the first date's `startDate`/`startTime` only if empty; set `isFree` to track `freeOrPaid` always, since it is a derived toggle). Implement `onSameAsBooking` to set the event first date's `startTime` (and `startDate` if empty) from `bookingStartTime(values)` / `values.startDate`. Compute `showDoorsHint = Boolean(values.doorsTime)`.

Wire validation: build the promotion DOM field ids from `useId()` alongside the existing `fieldIds`. Compute `const promotionMessages = getPromotionValidationMessages({ promote: values.promote, event: promotionForm.state.values, hasImageFile: Boolean(image.imageFile), uploadLater })` and map its placeholder `fieldId`s (the `PROMO_*` constants) to the real DOM ids. Concatenate these into the array passed to `useFormErrors` so they appear in the shared `ErrorSummary` and so `errorFor(realId)` lights up the inline section errors. The existing submit guard `if (validationErrors.length > 0) return` now also blocks on promotion errors. Subscribe to `promotionForm` values where needed so the booking re-renders when the event form changes (use `useStore(promotionForm.store, s => s.values)`), mirroring how `values` is read from the booking form.

Render `<BookingPromotionSection ... />` as the **last** section, after `BookingFormTermsSection`.

Edit `src/app/[locale]/rom/book/page.tsx`: add `fetchEventRooms`, `fetchEventTypes`, `fetchEventGroups` to the existing `Promise.all`, and pass the resulting arrays to `<BookingForm eventRooms={...} eventTypes={...} eventGroups={...} ... />`. In `BookingForm`, accept these new props and map them to `SelectOption[]` exactly as `EventForm` does (`{ value: _id, label }`, with the event-type label including the taxonomy group when present), then pass them to `BookingPromotionSection`.

Acceptance: `npm run lint` and `npm run build` pass. At `http://localhost:3187/no/rom/book`: the **Promotering** section is last; choosing **Ja** reveals the event fields with the title pre-filled from the booking event name, the start time pre-filled from doors time (or a working "Samme som booking" button when doors time is empty), and the free/paid toggle reflecting the booking; recurrence controls are absent; submitting with the yes/no unanswered shows "Velg om du vil promotere arrangementet." in the error summary; choosing **Ja** with no image and the checkbox unticked shows the image error; ticking "Jeg laster opp bilde senere" clears it. No event is created yet.

### Milestone 5 — Create the event on submit (combined flow) with partial-failure handling

Goal: make the single submit button also create the pending `arrangement` when the guest chose **Ja**, reusing `uploadEventImage` + `submitEvent`, and handle partial failure gracefully.

Edit the booking form's `useForm({ onSubmit })` in `src/features/booking/components/BookingForm.tsx`. After the existing successful `submitRoomBooking(...)` call (which currently `throw`s on `!result.ok`), add: if `value.promote === "ja"`, perform the event creation, mirroring `EventForm.onSubmit`. Build the image asset first only when `image.imageFile` exists: create `FormData`, append `image.imageFile`, call `uploadEventImage(formData)`; on `!ok`, treat as a promotion failure (see below). Then call `submitEvent({...})` mapping `promotionForm.state.values` to `SubmitEventInput` exactly as the standalone form does (title, description, dates filtered to those with `startDate`, room/roomText, organizerGroup/organizerText, eventTypeId, imageAssetId, isInternalEvent, isFree, prices, ticketUrl, facebookUrl, submittedBy, submittedByEmail, submittedByOrganization, honeypot). Do **not** send `isRecurring`/`rrule` (recurrence is off here). Import `uploadEventImage`, `submitEvent` from `@/features/events/actions/submitEvent`.

Partial-failure handling: the booking must already be considered succeeded at this point. Do not `throw` from a promotion failure (throwing would flip the whole form into the error state and hide that the booking went through). Instead, set a piece of component state, e.g. `const [promotionError, setPromotionError] = useState<string | null>(null)`, to a user-facing message when the upload or `submitEvent` returns `!ok`, and let the normal success path complete (so `isSubmitSuccessful` becomes true). In the success `Alert` block at the top of `BookingForm`'s render, when `promotionError` is set, append a non-blocking warning paragraph: "Bookingen er sendt, men promoteringen kunne ikke opprettes. Ta kontakt med pr@kvarteret.no." When `promote === "ja"` and the event was created successfully, optionally adjust the success copy to mention the event was sent for approval ("Arrangementet er sendt til godkjenning hos PR-gruppen.").

Add a PostHog capture when the guest opts into promotion (mirror the existing `posthog.capture("room_booking_started", ...)` style): capture `room_booking_promotion_opted_in` once when `promote` becomes `"ja"`, and include in the existing/booking submit telemetry a boolean `promote` so analytics can see uptake. Reset the image controller (`image.reset()`) and `setUploadLater(false)` is unnecessary after success because the success state replaces the form, but ensure no object URL leaks (the unmount revoke in `useEventImage` covers it).

Acceptance: `npm run lint`, `npm run build`, and `npm test` pass. End-to-end at `http://localhost:3187/no/rom/book`: filling the booking, choosing **Ja**, filling the event fields (title, a date, event contact name + valid email), optionally an image, and pressing **Send bookingforespørsel** results in the booking success state and a new `arrangement` document with `approvalStatus: "pending"` in Sanity (verify in Sanity Studio's pending-events list, or via the Sanity MCP `query_documents` for the newest `arrangement` with `approvalStatus == "pending"`). Choosing **Nei** creates no event. Simulating a promotion failure (temporarily make `submitEvent` return an error, or submit with `SANITY_WRITE_TOKEN` unset locally) shows the booking success with the non-blocking promotion warning, proving the booking is not lost.

## Concrete Steps

Run everything from the repository root `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

Create a feature branch first (the working tree starts on `develop`):

    git switch -c feat/booking-promotion-step

Implement Milestone 1, then verify:

    npm run lint
    npm run build

Implement Milestone 2, then verify the same two commands and a manual check of `/no/arrangementer/ny`.

Implement Milestone 3 (write `promotion.ts` and `promotion.test.ts`), then:

    npm test -- promotion

Expect the new file's tests to pass (about 8 cases). They must fail if you stub `buildPromotionDefaults`/`getPromotionValidationMessages` to return wrong values — run once with a deliberately wrong stub to confirm the tests are meaningful, then restore.

Implement Milestone 4, then:

    npm run lint
    npm run build
    npm run dev

and exercise `http://localhost:3187/no/rom/book` as described in that milestone's acceptance.

Implement Milestone 5, then:

    npm run lint
    npm run build
    npm test

and run the end-to-end check. Commit at each milestone boundary with a conventional message, e.g.:

    git add -A && git commit -m "refactor(events): extract useEventImage hook"
    git add -A && git commit -m "feat(booking): add Promotering step that can publish a pending event"

## Validation and Acceptance

The change is acceptance-tested by observable behavior, not by inspecting code:

The unit suite proves the rules: `npm test -- promotion` passes, and each rule (pre-fill precedence, free/paid mapping, the three validation branches, immutability) has a named test that fails if the rule is broken.

The combined flow proves the feature: with the dev server up, a booking submitted with **Ja** produces both a Crescat booking (as today) and a pending Sanity `arrangement`; a booking submitted with **Nei** produces only the Crescat booking; an unanswered Promotering question blocks submission with a visible, specific message; a missing image with the acknowledgement unticked blocks submission, and ticking the acknowledgement unblocks it; a forced promotion failure still completes the booking and shows the warning.

The standalone forms prove non-regression: `/no/arrangementer/ny` is visually and behaviorally unchanged (recurrence present, no "upload later" checkbox), confirming the opt-in props defaulted correctly.

## Idempotence and Recovery

All edits are additive or local refactors; re-running the steps is safe. Creating the branch is the only one-time action; if it already exists, `git switch feat/booking-promotion-step`. Each milestone leaves the build green, so a half-finished session can be resumed from `Progress` below. The new server-side work reuses existing actions that are already rate-limited and honeypot-protected (`submitEvent`/`uploadEventImage` enforce their own limits), so repeated manual testing cannot corrupt state beyond creating extra pending `arrangement` drafts, which the PR group can delete in Sanity Studio. No migrations or destructive operations are involved.

## Surprises & Discoveries

- Observation: The event sections are decoupled from the event form only through `EventFormContext`/`useEventForm`, not through props, which is exactly what makes embedding them in the booking form clean — a second `useForm` provided through the same context drives them with zero section edits (aside from the two opt-in props in Milestone 2).
  Evidence: `src/features/events/components/eventFormContext.ts` and every `EventForm*Section.tsx` calling `useEventForm()`.

## Decision Log

- Decision: One combined submit (booking first, then event) rather than a separate submit button for the promotion.
  Rationale: Single button keeps the guest's mental model simple; the promotion is a follow-on to a successful booking, so sequencing booking→event is natural.
  Date/Author: 2026-06-18, Martin Kleiven (product owner) via planning Q&A.

- Decision: The event collects its own contact (`EventFormSubmitterSection` shown) instead of reusing the booking contact.
  Rationale: The promotion contact can legitimately differ from the booking contact, and showing the section keeps the reused component unmodified.
  Date/Author: 2026-06-18, product owner Q&A.

- Decision: Pre-fill title, start time (doors time, else "Samme som booking" button copying booking start time), and free/paid; default the event date to the booking date even though date-prefill was not explicitly requested.
  Rationale: The three explicit pre-fills were chosen by the owner; the date default is a usability necessity because the event requires a valid date and an empty required field would immediately fail validation. The date stays editable, so the default cannot trap the user.
  Date/Author: 2026-06-18, product owner Q&A + plan author.

- Decision: Recurring events are not offered in the booking promotion (hide recurrence via `allowRecurring={false}`).
  Rationale: A booking is for a single occasion; recurrence would imply multiple bookings, which this flow does not create.
  Date/Author: 2026-06-18, product owner.

- Decision: Image optional but gated behind an explicit "Jeg laster opp bilde senere" acknowledgement, with a note that events are not published without an image.
  Rationale: The PR group cannot publish imageless events; forcing acknowledgement makes the consequence visible without hard-requiring an upload at booking time.
  Date/Author: 2026-06-18, product owner.

- Decision: On partial failure (booking ok, event failed), do not roll back; show booking success plus a non-blocking warning.
  Rationale: A Crescat request cannot be un-sent; the booking is the primary action and must not be reported as failed because the secondary draft creation failed.
  Date/Author: 2026-06-18, plan author.

## Outcomes & Retrospective

To be completed at milestone boundaries and at completion. Compare against the Purpose: a guest booking a room can opt into website promotion in the same flow, with shared data pre-filled, producing a pending event in Sanity alongside the Crescat booking, while guests who decline see no change.

## Progress

- [ ] Milestone 1 — Extract `useEventImage` hook; standalone event form unchanged.
- [ ] Milestone 2 — Add `allowRecurring` to schedule section and "upload later" props to image section (both opt-in, defaults preserve current behavior).
- [ ] Milestone 3 — `promotion.ts` pre-fill + validation functions with passing `promotion.test.ts`.
- [ ] Milestone 4 — `promote` field in booking state; `BookingPromotionSection`; second TanStack form via `EventFormContext`; pre-fill, "Samme som booking", merged validation; page fetches event option data. (No event submitted yet.)
- [ ] Milestone 5 — Combined submit creates the pending event via `uploadEventImage` + `submitEvent`; partial-failure warning; PostHog telemetry.

## Interfaces and Dependencies

New module `src/features/events/domain/useEventImage.ts`:

    export interface EventImageController {
      imageFile: File | null
      imagePreviewUrl: string | null
      imageUploadError: string
      onImageChange: (event: ChangeEvent<HTMLInputElement>) => void
      onRemoveImage: () => void
      reset: () => void
    }
    export function useEventImage(): EventImageController

New module `src/features/booking/domain/promotion.ts`:

    export const PROMOTE_FIELD: string
    export const PROMO_TITLE_FIELD: string
    export const PROMO_FIRST_DATE_FIELD: string
    export const PROMO_SUBMITTER_FIELD: string
    export const PROMO_SUBMITTER_EMAIL_FIELD: string
    export const PROMO_IMAGE_FIELD: string

    export function buildPromotionDefaults(
      booking: Pick<BookingFormState, "eventName" | "startDate" | "startTime" | "doorsTime" | "freeOrPaid">,
      base: EventFormState,
    ): EventFormState

    export function bookingStartTime(booking: Pick<BookingFormState, "startTime">): string

    export interface PromotionValidationInput {
      promote: BookingFormState["promote"]
      event: EventFormState
      hasImageFile: boolean
      uploadLater: boolean
    }
    export function getPromotionValidationMessages(
      input: PromotionValidationInput,
    ): { fieldId: string; message: string }[]

New component `src/features/booking/components/BookingPromotionSection.tsx` with the props interface shown in Milestone 4.

Changed types: `src/features/booking/domain/formState.ts` `BookingFormState` gains `promote: "" | "ja" | "nei"`; `initialBookingState.promote = ""`.

Changed props (optional, backward-compatible): `EventFormScheduleSection` gains `allowRecurring?: boolean` (default `true`); `EventFormImageSection` gains `uploadLater?: boolean` and `onUploadLaterChange?: (value: boolean) => void`.

Reused existing exports (do not reimplement): `uploadEventImage`, `submitEvent`, `SubmitEventInput` from `src/features/events/actions/submitEvent.ts`; `initialState`, `FormState` from `src/features/events/domain/formState.ts`; `getEventValidationIssues` from `src/features/events/domain/validation.ts`; `isAcceptedEventImageType`, `EVENT_IMAGE_MAX_SIZE_BYTES`, `formatEventImageMaxSize` from `src/features/events/domain/imageUpload.ts`; `fetchEventRooms`, `fetchEventTypes`, `fetchEventGroups` from `@/lib/sanity/fetch`; `useFormErrors` from `src/lib/use-form-errors.ts`; `EventFormContext` from `src/features/events/components/eventFormContext.ts`; `Result`/`ok`/`err` from `src/lib/result.ts`.

## Note on this revision

Initial authoring (2026-06-18). Scope and key decisions were fixed in a planning Q&A with the product owner (combined submit, separate event contact, pre-fill of title/start-time/price, sections image+description/type/place+organizer/price+links, no recurrence, image-or-acknowledge gate, non-rollback partial-failure). The plan deliberately front-loads two additive refactors (Milestones 1–2) so the reuse seam (`EventFormContext`) and the image hook exist before the booking form is wired, keeping every milestone build-green and independently verifiable.
