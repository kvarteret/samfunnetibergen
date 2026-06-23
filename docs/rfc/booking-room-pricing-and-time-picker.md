# RFC: Room pricing, room card redesign, and time picker rework

## Status

Accepted

## Context

The room booking form (`src/features/booking/`, `/rom/book`) had three gaps:

1. **No pricing.** The form collected room, schedule, and service needs (technicians, catering, bar)
   but never showed a price. Kvarteret wants exposed, self-service pricing for external bookers while
   keeping internal bookers and student organizations free of room rent, plus a way to charge for
   opt-in services (technicians, rigging/teardown, bar staffing) regardless of booker type.
2. **Room cards doubled as both the selection control and the hover-preview trigger.** The whole card
   was a `<label>`/checkbox, and a separate `PreviewCard` (hover-only) wrapped it for the facility
   details popup. This meant hovering to preview and clicking to select fought over the same hit
   target, didn't work on touch devices (no hover), and the preview popup's `z-50` could be clipped
   by sibling cards.
3. **The start/end time picker had no editable display and a single "doors open" value.** The slider
   showed a plain `"19:00 — 23:00"` text readout with no way to type or pick a time directly, and
   "dørene åpner" was one value even for multi-day bookings, where the public doors time can
   legitimately differ per day.

## Decision

### 1. Room pricing (`src/features/booking/domain/pricing.ts`)

- Added `pricePerHour` (number, kr eks. mva) to the Sanity `room` schema and to the
  `bookableRoomsQuery` / `roomBySlugQuery` GROQ projections. Published hourly rates for the 10
  existing rooms.
- `computePriceSummary(state, rooms)` returns itemized `PriceLine[]` plus `subtotalExVat`, `vat`
  (25%), and `totalIncVat`. Room rent (`pricePerHour × hours`) is only included when
  `bookerType === "ekstern"` — internal bookers and student organizations never pay room rent, but
  everyone pays for opt-in services they select (lydtekniker/lystekniker 3500 kr each, opprigg/nedrigg
  2000 kr each, "Kvarteret står i bar" 2000 kr).
- Stillhet (room 118) is free when bundled with Teglverket (room 97) — its line is skipped if both
  are selected, since the venue treats it as included with Teglverket.
- Eldorado and Lobbyrinten have no Sanity document and no confirmed standalone Crescat resource ID,
  so they are **not** modeled in pricing or auto-add logic — Eldorado is informational only (included
  free with Tivoli), and Lobbyrinten is likewise informational (included with Storelogen/Halvtimen).
  If either later gets a real bookable identity, this should be revisited.
- The order summary (`BookingFormOrderSummary`) renders the breakdown only when there's at least one
  priced line, so bookings with nothing payable (e.g. an internal booker with no add-on services)
  show no price section at all.

### 2. Room card redesign (`BookingFormScheduleSection.tsx`)

- Replaced the whole-card checkbox with an explicit `AddRoomButton`: a plain `+` button that becomes
  a "Lagt til" pill (with a checkmark) once added. The card itself is no longer a click target.
- Replaced the hover-only `PreviewCard` with a `Popover`-based `RoomInfoTrigger`: a small "Mer info"
  button with `openOnHover` + `delay={0}` (instant on desktop) that also opens on tap, since it's a
  real button rather than a hover-only affordance. Bumped its popup to `z-[100]` so it renders above
  sibling cards instead of being clipped — the old `z-50` collided with other panel-level content.
- Occupied rooms get `opacity-60 saturate-50` plus a full-width "Opptatt" banner across the image
  (previously a small corner tag), making the unavailable state obvious without disabling the card.

### 3. Time picker rework (`TimeRangeSlider`, `DateTimePicker`, new `TimeSlotBox`)

- Added a DM Mono font (`next/font/google`, mapped to Tailwind's `font-mono`) for time displays.
- Replaced the plain start/end text with two `TimeSlotBox` controls ("Get-in" / "Get-out"): clicking
  one opens a grid of 15-minute slots colored by availability (subtle green = selectable, subtle red
  = booked and disabled). Selecting a slot calls the same commit handler the slider drag uses, so the
  boxes and the slider thumbs can never disagree about the current value.
- Added "Get-in"/"Get-out" labels directly above the slider thumbs, and an info popover explaining the
  terms (get-in = arriving and taking responsibility for the room at the agreed time; get-out = fully
  out, including cleanup/teardown, by the agreed end). For multi-day bookings, get-in is day 1 and
  get-out is the last day — the days in between don't change these two times.
- Converted `doorsTime: string` into `doorsTimes: string[]`, one independent optional value per day
  spanned by the booking (see the ADR 001 addendum for the Crescat-side payload change). The UI shows
  only day 1's box by default, with two follow-up actions: "Dørene åpner samme tid hver dag" (fills
  every day with day 1's value in one click) and "Legg til dag N" (reveals one more day's box at a
  time). This keeps the common single-value case a single click while still allowing full per-day
  control for bookings that need it.
- Fixed a pre-existing bug where multi-day bookings with no room selected (so no room-specific
  opening hours apply, only the unconstrained 24h grid) could compute a `NaN` duration and show
  `00:00` for get-out — the last day's mark search could fail to land on a real index.

## Consequences

- Pricing is an estimate shown to the booker, not an authoritative invoice — Kvarteret still confirms
  and invoices manually. If hourly rates or VAT rules change, update the room documents in Sanity
  Studio and `pricing.ts`'s flat service fees respectively; no code change is needed for rate changes.
- The Stillhet/Teglverket bundling rule and the Eldorado/Lobbyrinten non-modeling are both special
  cases hard-coded by Crescat room ID (97, 118) in `pricing.ts`. If the venue's room lineup or bundling
  policy changes, these constants need updating alongside the price table.
- `doorsTimes` is a breaking shape change from the previous `doorsTime` string — anything reading the
  booking payload or Crescat `assignments` content downstream of this change needs to expect an array.
