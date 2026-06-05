# RFC: Align booking, karaoke, and event submission flows

## Status

Proposed

## Context

The website currently has three related public form flows:

- Room booking at `/rom/book`, implemented by `src/features/booking/`, submits a Crescat event
  request through `src/app/actions/submit-room-booking.ts`.
- Karaoke booking at `/karaoke`, implemented by `src/features/karaoke/`, submits a Crescat event
  request through `src/app/actions/submit-karaoke-booking.ts`.
- Event submission at `/arrangementer/ny`, implemented by `src/features/events/`, creates a pending
  Sanity `arrangement` document through `src/features/events/actions/submitEvent.ts`.

These flows overlap heavily, but they currently model different slices of the same user intent.
This makes users repeat information and makes the codebase duplicate form primitives.

The important product distinction is that a booking and a public event are not the same object:

- A booking reserves a room for an operational interval.
- A public event describes what appears in the calendar, feeds, and event detail pages.

For many room bookings, the booking request should also become an event submission. The booking
window often includes setup, doors, soundcheck, and teardown, while the public event time usually
means showtime or audience-facing start/end. The current room booking form does not model that split
explicitly.

## Current Source Evidence

Arrangement submission writes Sanity:

- `src/app/[locale]/arrangementer/ny/page.tsx` fetches Sanity rooms, event types, and groups, then
  renders `SubmitEventForm`.
- `src/features/events/components/SubmitEventForm.tsx` collects title, description, image, schedule,
  room, organizer, prices, ticket URL, Facebook URL, and submitter contact.
- `src/features/events/actions/submitEvent.ts` creates a pending Sanity `arrangement` with
  `approvalStatus: "pending"`.
- `src/studio/schemaTypes/documents/event.ts` defines public event fields including dates, room,
  organizer, prices, ticket URL, Facebook URL, image, SEO, and approval status.

Room booking writes Crescat:

- `src/app/[locale]/rom/book/page.tsx` fetches bookable rooms and house hours, then renders
  `RoomBookingForm`.
- `src/features/booking/domain/formState.ts` collects booker type, room, event name, start/end,
  doors time, audience count, open/closed, description, furniture, tech, catering/bar, ticket text,
  invoice/contact fields, flexibility, and terms.
- `src/app/actions/submit-room-booking.ts` validates the payload, checks Crescat conflicts, checks
  Sanity-defined availability, then posts to Crescat.
- `src/lib/integrations/crescat/room-booking.ts` maps room booking state to the standard or internal
  Crescat event-request form.

Karaoke booking writes Crescat:

- `src/app/[locale]/karaoke/page.tsx` fetches the Maos room and house hours, then renders
  `KaraokeBookingForm`.
- `src/features/karaoke/components/KaraokeBookingForm.tsx` collects event name, date, duration,
  description, contact info, package/price type, people count, and terms.
- `src/app/actions/submit-karaoke-booking.ts` checks Sanity-defined availability and posts to
  Crescat.
- `src/lib/integrations/crescat/karaoke.ts` maps karaoke booking state to the karaoke Crescat form.

Crescat integration boundaries are documented in `docs/adr/001-crescat-integration.md`.

## Problems

### Users repeat event information

Room booking and event submission both ask for:

- event title/name
- description
- room/place
- date and time
- contact name and email
- price/ticket information

Today, a user who books a room and wants the event published must fill out both the booking form and
the event submission form manually.

### Showtime and booking time are conflated

Room booking currently has `startTime` and `endTime`. These values become the top-level Crescat
request start/end and the `roomBooking` interval.

That is not enough for a real event lifecycle. A single booking may need:

- setup/load-in start
- doors time
- public showtime
- public event end
- teardown/load-out end

Karaoke is simpler because the reserved slot and user-facing activity are usually the same interval.
Room booking is not.

### Ticket information is inconsistent

Event submission has structured prices and a `ticketUrl`. Room booking only has `freeOrPaid` plus a
free-text `ticketTypes` field. Karaoke has package-specific pricing and no public ticketing fields.

For public room events, a ticket URL could become the easiest data-entry path: if the user pastes a
TicketCo, Tikkio, Ticketmaster, Hoopla, Facebook, or similar URL, the system can propose title,
description, date, image, prices, and organizer data.

### Form components are duplicated

The karaoke form has a local date/slot picker. The room booking form now has a similar room-filtered
date strip and separate time selectors. Event submission uses generic date/time inputs. They share
concepts but not a component contract.

### External system state is not persisted locally

Room and karaoke submissions post to Crescat and return a result. The website does not persist a
local booking request record. That means the site cannot reliably attach later Sanity event drafts,
uploaded promotion assets, or staff review state to a booking request unless a local record or
Sanity-side intake document is introduced.

## Goals

- Save user effort when a booking should also become a public event.
- Keep Crescat as the booking/request system for room and karaoke reservations.
- Keep Sanity `arrangement` as the public event source for listing, detail pages, feeds, and Studio
  review.
- Model booking window and public showtime separately.
- Share field models and UI primitives where behavior is actually common.
- Allow ticket/event URL enrichment while keeping user review and server-side safety boundaries.

## Non-goals

- Replace Crescat as the room booking system.
- Publish events automatically without PR/editor approval.
- Infer reliable room availability from Sanity alone; Crescat remains the live conflict source.
- Build a general web crawler in the first phase.
- Rework all form styling or route structure.

## Proposed Model

Introduce a shared intake vocabulary used by all three flows:

```ts
type EventIntent = {
  title: string
  description?: string
  publicVisibility: "public" | "internal" | "private"
  roomId?: string
  roomText?: string
  organizerGroupId?: string
  organizerText?: string
  audienceCount?: number
  ticketUrl?: string
  facebookUrl?: string
  pricing?: EventPricing
  imageAssetId?: string
}

type EventTiming = {
  date: string
  bookingStartTime?: string
  doorsTime?: string
  showStartTime: string
  showEndTime?: string
  bookingEndTime?: string
}

type BookerContact = {
  name: string
  email: string
  phone?: string
  organization?: string
}
```

This does not require these exact exported TypeScript names, but the concepts should become explicit.

The core rule:

- Crescat receives `bookingStartTime` to `bookingEndTime`.
- Sanity `arrangement.dates[]` receives `showStartTime` and `showEndTime`.
- `doorsTime` remains a separate operational/public cue and can map to Crescat assignments.

For simple flows, defaults can collapse the fields:

- Karaoke: `bookingStartTime = showStartTime`; `bookingEndTime = showEndTime`.
- Simple room booking: initial UI may default setup/teardown to zero, so booking and showtime match
  until the user expands "setup and teardown".
- Event-only submission: no booking times are needed.

## Proposed Workflows

### Event-only submission

Use `/arrangementer/ny` when a room is already handled, not relevant, or outside the booking flow.
The form writes one pending Sanity `arrangement`.

This flow should keep its preview and image upload behavior, but should share:

- event details fields
- public timing fields
- room picker
- organizer picker
- ticket URL enrichment
- contact fields

### Room booking that should also be public

Add a choice to the room booking form:

> "Should this also appear in the event calendar?"

If yes, show a "Public event details" step after room/time selection. Pre-fill it from booking data:

- title from event name
- room from selected room
- date from selected booking date
- show start/end initially from current start/end
- description from booking description
- ticket/free-paid data from ticket fields
- contact from booking contact

Then ask only for missing public fields:

- event type
- organizer group or organizer name
- publishable image, or "add later"
- ticket URL or explicit no-ticket state
- public description if the internal booking description is not suitable

On submit, the initial implementation should:

1. Submit the booking request to Crescat.
2. If successful and the user opted into calendar publication, create a pending Sanity
   `arrangement`.
3. Show one confirmation page that clearly says the room booking and event publication are separate
   approvals.

This is acceptable even without a local booking record, but it has weak traceability. A later phase
should add a local/Sanity intake document that stores the Crescat request id returned by
`postEventRequest` and the created Sanity arrangement id.

### Karaoke booking

Karaoke should remain a booking-only flow by default. Most karaoke bookings are private/package
bookings, not public arrangements.

Karaoke can still use shared primitives:

- availability date strip
- slot picker
- contact fields
- event name/description fields
- terms action

If karaoke ever needs public listings, it should reuse the same optional "also publish as event"
step, but hidden by default.

## Ticket URL Enrichment

Add an optional "Import from ticket/event link" entry point to event submission and public room-event
details.

The behavior should be:

1. User pastes a URL.
2. Server validates URL scheme and host.
3. Server fetches the page with a short timeout and size limit.
4. Server extracts only metadata that is reasonable to trust:
   - Open Graph title/description/image
   - JSON-LD Event fields when present
   - canonical URL
   - visible date/time only if the source is recognized and parsing is reliable
5. UI shows an editable preview and asks the user to accept suggested values.
6. Nothing is written to Sanity or Crescat until the user submits the form.

Security and reliability constraints:

- Use an allowlist or provider adapter registry before expanding to arbitrary hosts.
- Block private IP ranges, localhost, link-local, and non-http(s) schemes to avoid SSRF.
- Do not execute page JavaScript in the first implementation.
- Do not scrape pages requiring login, payment, or terms bypass.
- Cache by URL for a short period to avoid repeatedly fetching third-party pages.
- Treat imported content as untrusted text; sanitize before rendering and before Portable Text
  conversion.

Provider adapters can improve quality later:

- TicketCo/Tikkio/Hoopla/Ticketmaster: event title, date/time, prices, image, canonical ticket URL.
- Facebook event: title/image/date where publicly exposed, but expect missing data and rate limits.

## Shared Components and Domains

Create shared, domain-specific primitives instead of forcing the existing forms into one large form.

Suggested structure:

```txt
src/features/event-intake/
  components/
    EventDetailsFields.tsx
    EventTimingFields.tsx
    EventContactFields.tsx
    EventTicketFields.tsx
    AvailabilityDateStrip.tsx
    TimeSlotPicker.tsx
  domain/
    eventIntent.ts
    timing.ts
    ticketImport.ts
```

Then let each flow compose those primitives:

- `src/features/events/` owns public event submission and preview.
- `src/features/booking/` owns room booking specifics: booker type, room availability, furniture,
  tech, catering/bar, invoice, terms, and Crescat mapping.
- `src/features/karaoke/` owns karaoke-specific package pricing, student proof, people count, and
  karaoke Crescat mapping.

Shared components should expose product concepts, not raw form state. For example,
`AvailabilityDateStrip` should receive `dates`, `isAvailable(date)`, `selectedDate`, and `onSelect`,
rather than knowing about karaoke or room booking state.

## Data Mapping

| Concept | Room booking today | Karaoke today | Event submission today | Proposed shared meaning |
|---|---|---|---|---|
| Title | `eventName` | `eventName` | `title` | `EventIntent.title` |
| Description | booking description | booking description | public description | Separate internal notes from public description where needed |
| Room | Sanity room with `crescatRoomId` | fixed Maos/Karaoke room | Sanity room reference or text | Shared room reference when public event uses a known room |
| Booking interval | `startTime` to `endTime` | date + duration | none | Crescat reservation interval |
| Showtime | same as booking interval | same as booking interval | arrangement date start/end | Public event interval |
| Doors | optional `doorsTime` | none | none | Optional public/operational timing field |
| Contact | contact name/email/phone | contact name/email/phone | submitter name/email/org | Shared contact plus flow-specific billing fields |
| Tickets | free/paid + free text | package pricing | prices + `ticketUrl` | Structured public ticketing plus Crescat fallback text |
| Image | deferred promotion | none | upload to Sanity | Optional public event image, not required for booking |
| Approval | Crescat staff approval | Crescat staff approval | Sanity PR approval | Separate booking approval from publication approval |

## Phased Implementation

### Phase 1: Reduce duplication without changing persistence

- Extract `AvailabilityDateStrip` from the room and karaoke date pickers.
- Extract shared contact and event details field components.
- Add explicit showtime fields to room booking while defaulting them from the booking interval.
- Keep room and karaoke posting only to Crescat.
- Keep event submission posting only to Sanity.

### Phase 2: Optional event creation from room booking

- Add the "also publish as event" step to room booking.
- Reuse event-intake fields and preview from event submission.
- On successful Crescat booking request, create a pending Sanity `arrangement`.
- Store enough user-facing confirmation data to explain both approval paths.

Open decision: whether to add a new Sanity `bookingIntake` document now, or wait until staff need a
cross-reference between Crescat request ids and Sanity arrangements.

### Phase 3: Ticket URL enrichment

- Add a server action for URL metadata extraction.
- Start with Open Graph and JSON-LD Event extraction.
- Add provider adapters only where generic extraction is not enough.
- Let the user accept, reject, and edit suggestions before submission.

### Phase 4: Staff review improvements

- If room bookings commonly create public events, introduce a durable intake object with:
  - Crescat request id
  - Sanity arrangement id
  - source flow
  - booking approval status if it can be observed or manually updated
  - submitter contact
  - ticket import source URL and extraction metadata

This avoids trying to infer booking/publication relationships from titles and dates.

## Open Questions

- Should public event creation happen immediately after Crescat request success, or only after staff
  confirm the booking in Crescat?
- Is a public event image required at submission time, or can PR add it later?
- Which ticket providers should be supported first?
- Should internal bookings default to `isInternalEvent = true` when creating a Sanity arrangement?
- Should ticket URL enrichment be available on `/arrangementer/ny` before it is added to room
  booking?
- What should happen if Crescat submission succeeds but Sanity event creation fails?

## Recommendation

Do Phase 1 and Phase 3 first.

Phase 1 removes the most obvious form/UI divergence and gives the product a correct timing model.
Phase 3 can save effort for both event-only submissions and room-booking-derived public events.

Then implement Phase 2 once the shared public event fields are stable. That keeps the integration
small enough to verify: Crescat remains the booking owner, Sanity remains the event publication
owner, and the user only enters shared data once.
