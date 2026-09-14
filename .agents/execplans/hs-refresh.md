# HS visual refresh

This ExecPlan is a living document. It is maintained in accordance with
`.agents/PLANS.md` from the repository root.

## Purpose / Big Picture

After this change, visitors to Samfunnet i Bergen will see the approved HS
visual refresh with a warm-white page, Fraunces editorial headings, DM Sans
body/navigation text, and golden-orange secondary details. The existing Skyss
theme remains available and unchanged. The events catalogue and homepage
promoted events will use one
accessible, image-first event-card composition, while the existing homepage
weekly-events slider keeps its current horizontal interaction and geometry.

The result is observable by starting the web app, visiting a localized
`/arrangementer` route and the homepage, changing themes in the existing
settings menu, resizing to desktop/tablet/mobile widths, and navigating from a
whole event card to its existing localized detail page.

## Progress

- [x] (2026-09-14 18:50 Europe/Oslo) Read the root repository guidance, the
  complete implementation specification, and the focused arrangement and web
  verification skills.
- [x] (2026-09-14 18:50 Europe/Oslo) Visually inspected all four supplied
  reference screenshots before coding.
- [x] (2026-09-14 18:51 Europe/Oslo) Verified the current theme, font, navbar,
  event-card, homepage event surfaces, and carousel source entry points.
- [x] (2026-09-14 18:52 Europe/Oslo) Created the `codex/hs-refresh`
  implementation branch from `origin/develop`.
- [x] (2026-09-14 20:56 Europe/Oslo) Implemented the shared typography and HS
  semantic tokens while
  preserving the Skyss token set and paper preferences.
- [x] (2026-09-14 20:56 Europe/Oslo) Kept the two-theme preference resolution
  and selector paths hydration-safe, including migration of stale HS2 values.
- [x] (2026-09-14 20:56 Europe/Oslo) Added explicit localized active-route
  styling to desktop and mobile
  navigation without changing navigation structure.
- [x] (2026-09-14 20:56 Europe/Oslo) Extended the existing EventCard with
  explicit presentation variants,
  then reuse it for catalogue, promoted, and weekly slider event cards.
- [x] (2026-09-14 20:56 Europe/Oslo) Verified focused behavior, responsive
  layout, keyboard accessibility, and unchanged production content/assets.
- [x] (2026-09-14 21:10 Europe/Oslo) Removed the alternate HS2 theme and
  orange hover backgrounds, unified flat card surfaces across events, groups,
  rooms, sponsors, and services, and aligned event media to 16:9 with white
  weekly-card text on the homepage red surface.
- [x] (2026-09-14 21:12 Europe/Oslo) Committed the scoped changes, pushed
  `codex/hs-refresh`, and created PR #143 against `develop`; no merge or
  deployment was performed.

## Surprises & Discoveries

- Observation: The homepage weekly events surface currently uses the existing
  `HorizontalScrollRow` rather than the repository's Embla-based `Carousel`
  primitive.
  Evidence: `apps/web/src/app/[locale]/page.tsx` renders
  `HorizontalScrollRow`; `apps/web/src/components/ui/carousel.tsx` is used by
  other surfaces. The plan therefore preserves the current slider interaction
  and does not introduce a second carousel implementation.
- Observation: The existing `EventCard` has separate links for its image and
  title, while the homepage promoted and weekly cards already use a whole-card
  link.
  Evidence: `apps/web/src/features/events/components/EventCard.tsx` and the
  two homepage card functions in `apps/web/src/app/[locale]/page.tsx`. The
  shared card work must avoid nested interactive elements while retaining room
  links and tracking semantics where those are required.
- Observation: The repository currently loads Hegval, Source Serif 4, Lora,
  and DM Mono from `apps/web/src/app/layout.tsx`; the approved pairing is a
  deliberate global replacement for HS, while Skyss must retain its
  existing typography.
  Evidence: the root layout font declarations and the theme-specific
  `--font-display`/`--body-font` assignments in `globals.css`.

## Decision Log

- Decision: Use the existing `next/font/google` loaders for Fraunces and DM
  Sans and keep `display: "swap"`, limited weights, and the Latin subset.
  Rationale: the checked-in Next.js font guidance says the loader self-hosts
  fonts at build time, avoids browser requests to Google, and supports
  preload/layout-stability controls. This follows the repository convention
  without copying runtime Google Fonts CSS from the study.
  Date/Author: 2026-09-14 / Codex.
- Decision: Keep the current `HorizontalScrollRow` weekly interaction and
  responsive card widths, and share only card markup/presentation with the
  catalogue and promoted cards.
  Rationale: the specification explicitly requires the current slider
  behavior, including end states and reduced event counts; changing it to a
  static list or forcing the reference geometry would be an out-of-scope
  redesign.
  Date/Author: 2026-09-14 / Codex.
- Decision: Treat the card as one localized event-detail link and keep the room
  as plain text inside the card presentation.
  Rationale: the specification requires keyboard focus, new-tab support, and no
  nested interactive elements. The current card's room link conflicts with a
  whole-card link, so the room text will remain visible without creating a
  second target inside the card.
  Date/Author: 2026-09-14 / Codex.
- Decision: Keep only one visible date/time line on recurring event cards and
  omit organizer metadata from cards while retaining it on the event detail
  page.
  Rationale: the requested card hierarchy prioritizes type, date/time, title,
  and location; repeating the same “I morgen” string made the compact card
  noisy.
  Date/Author: 2026-09-14 / Codex.
- Decision: Keep the HS and Skyss themes and remove the alternative HS2 theme.
  Rationale: the latest direction narrows the public theme surface and avoids
  preserving a theme that no longer has a product requirement. Stale HS2
  preferences are cleared before paint and fall back to HS.
  Date/Author: 2026-09-14 / Codex.
- Decision: Remove orange hover backgrounds from the refreshed surfaces.
  Rationale: orange remains the HS secondary/selected-control color, while
  hover states should not add background noise to the editorial layout.
  Date/Author: 2026-09-14 / Codex.

## Outcomes & Retrospective

Implementation is complete and was reviewed in the local Chrome preview at
desktop and mobile widths. The catalogue has the simplified editorial header,
16:9 event cards, type-only rounded labels, no organizer text, no month or
“Kommende først” controls, and large grouped filters. Recurring cards show the
date/time once. Event, group, room, sponsor, and service cards now share the
flat warm-paper base without decorative borders or orange hover backgrounds.
The homepage retains its red weekly horizontal row with white section,
heading, link, and card text plus the existing data-driven cards.

`npm run typecheck:web`, `npm run lint:web`, `npm run test:web` (361 passed, 5
skipped), and `npm run build:web` (141/141 pages) passed. Runtime checks
covered `/nb`, `/nb/arrangementer`, `/nb/arrangementer/kalender`,
`/nb/rom`, and `/nb/grupper` at desktop and mobile sizes; active navigation
semantics, whole-card event links, 16:9 ratios, recurring-card
deduplication, flat card surfaces, no orange hover backgrounds, white weekly
card text, and the HS/Skyss theme boundary were verified. No Sanity
schema/query changes, merge, or deployment were performed.

## Context and Orientation

The repository is an npm workspace containing the public web app under
`apps/web`. Its localized App Router pages are under
`apps/web/src/app/[locale]`; the locale layout wraps every page with the
existing navbar, paper surface, and footer. `apps/web/src/app/layout.tsx`
loads fonts and the pre-paint theme script. `apps/web/src/app/globals.css`
defines the semantic CSS variables consumed by Tailwind utility classes and
the paper background pattern.

Theme names are validated and persisted by
`apps/web/src/lib/theme-preference.ts`; the pre-paint script is embedded by
the root layout, and `apps/web/src/components/navbar/ThemePicker.tsx` is the
existing user-facing selector. The source of truth for the current three
navigation levels is `apps/web/src/components/navbar/navigation-items.ts`,
with desktop and mobile rendering in `DesktopNav.tsx` and `MobileMenu.tsx`.

Public event data comes from the shared Sanity-backed service and is converted
to the `EventSummary` contract in the events page and homepage. The shared
visual card is `apps/web/src/features/events/components/EventCard.tsx`.
Catalogue rendering is in `EventsPageSections.tsx`; promoted and weekly
homepage rendering is currently in the two card functions in
`apps/web/src/app/[locale]/page.tsx`. The weekly row uses
`_components/HorizontalScrollRow.tsx`, which must remain the interaction
boundary. The existing event detail route is
`apps/web/src/app/[locale]/arrangementer/[event]/page.tsx`.

The supplied PNGs are design references only. They contain sample titles,
illustrative poster artwork, and prototype controls that must not be copied
into production. Current Sanity content, labels, translations, logo, image
helpers, filters, counts, sorting, empty/loading/error states, and route
behavior are authoritative.

## Plan of Work

First update `apps/web/src/app/layout.tsx` to load Fraunces for editorial
headings and DM Sans for body/navigation text with the repository's existing
`next/font` mechanism. Keep the existing Skyss font variables available, then
assign the new pairing only to HS semantic font variables in `globals.css`.
Add the warm-white `#FAF7F2`, HS orange `#F2A33A` and tint `#FBEBD5` as
scoped semantic tokens. Red remains the primary surface/action and active-nav
color. Skyss's current values remain isolated under its theme selector.

Next preserve the existing two-theme `theme-preference.ts` and pre-paint
script paths while keeping the selector hydration-safe. Keep the existing
paper selector and menu layout.

Then add a small route-matching helper, preferably alongside the navigation
model, that consumes the localized pathname from `usePathname` and determines
whether a navigation link represents the current page or one of its intended
descendants. Use it in the desktop and mobile navigation renderers to add a
stable two-pixel red underline and `aria-current="page"` to the active
localized label. Do not mark the home link active for every route, and do not
make both `/arrangementer` and `/arrangementer/kalender` active at once.
Dropdown triggers should be marked active only when their own route or an
intentionally owned descendant is current. Preserve focus styles, controls,
ordering, menus, sticky behavior, and mobile behavior.

Finally reshape `EventCard.tsx` around explicit variants such as catalogue,
promoted, and compact-slider (names may follow the actual implementation),
sharing image, category/date metadata, heading, location, fallback, tracking,
and optional recurring/status semantics. The outer card link must be the
existing localized route and must not contain nested interactive elements.
Preserve the image fallback and current Sanity image/focal-point helpers. Use
the shared card in `EventsPageSections.tsx`, `HomePromotedEvents`, and
`HomeUpcomingEvents`, keeping their existing selection, ordering, grid
placement, red weekly section, horizontal overflow, swipe/scroll behavior,
and navigation controls. Remove only the redundant visible “Se arrangement”
CTA if it is present in the affected card composition; no production copy or
assets from the references may be added.

Use responsive widths that produce three comfortable columns on wide desktop,
two on tablet, and one on narrow mobile. Avoid arbitrary word breaking or
truncation so Norwegian and English titles, including æ/ø/å, remain readable.
Do not change the calendar layout, booking/karaoke/room pages, footer,
volunteer blocks, or unrelated content.

## Concrete Steps

Run all commands from `/Users/kluvin/.codex/worktrees/4477/samfunnetibergen`.

1. Confirm the branch and clean baseline with `git status --short --branch`.
2. Apply the scoped edits described above with `apply_patch`. Do not rewrite
   generated Sanity files because this task does not change schema or query
   shapes.
3. Install the locked workspace dependencies only if needed for verification
   using the repository's package manager, then run the focused tests, type
   checks, lint, and web build selected in the next section.
4. Start the web app on its existing port and inspect localized HS and Skyss
   pages at desktop, tablet, and mobile widths. Capture implementation
   screenshots for the catalogue, navbar, and weekly slider where practical.
   Verify keyboard focus and links manually.
5. Review `git diff --check`, the complete diff, and `git status`; remove any
   unrelated or prototype content. Commit with a scoped message, push
   `codex/hs-refresh` to `origin`, and create a PR against the repository's
   normal development base. Do not merge or deploy.

## Validation and Acceptance

The implementation is accepted when `npm run typecheck:web`,
`npm run lint:web`, the relevant web tests, and `npm run build:web` pass (or a
known unrelated baseline failure is isolated and reported). The event route
and theme changes do not alter Sanity query shapes, so `npm run sanity:typegen`
is not required unless implementation unexpectedly touches a query or schema.

At runtime, `/nb/arrangementer` and `/en/arrangementer` show a responsive card
grid using real production events and current filters. Each card has one
accessible localized event-detail target, the existing image/metadata, no
redundant “Se arrangement” CTA, and no nested interactive room link. Long
titles wrap naturally; missing images or room/date metadata do not leave
broken layout.

The homepage promoted cards use the same shared composition and preserve
selection/order. The red weekly section remains horizontally scrollable with
the existing row behavior, including usable first/last positions and fewer
than five events. Its cards navigate to event details and retain the current
red section treatment.

HS renders `#FAF7F2` and `#F2A33A` secondary details and uses Fraunces
headings and DM Sans body/navigation/date/control text. The navbar's current
label has a stable roughly 2px red underline and `aria-current="page"` in
both themes, including localized descendants. Skyss retains its existing
palette and typography. Changing any theme in the existing selector persists
through reload and navigation without first-paint theme flash or hydration
mismatch. The existing paper selector still works.

Unchanged pages such as calendar, rooms, booking, karaoke, and footer are
spot-checked for global font/token regressions. The PR description will list
the checks, runtime routes/viewports, screenshot paths, and any genuine
limitations.

## Idempotence and Recovery

The edits are additive and safe to re-run. If a check fails, keep the failing
diff in place, isolate whether it is caused by a touched path or baseline
noise, and adjust only the scoped source. Do not reset the worktree or delete
user changes. If a pushed branch or PR needs a correction, amend the source
with another scoped commit and update the same branch; do not merge or deploy.

## Artifacts and Notes

Expected review artifacts are the implementation source diff, focused test and
build output, and local screenshots of the real application rather than the
design-study PNGs. The PR must link to the pushed branch and clearly note that
deployment and merge were intentionally not performed.

## Interfaces and Dependencies

The final implementation must continue using the existing interfaces:

- `ThemeName`, `themeOptions`, `isTheme`, `resolveTheme`, and
  `themePreferenceScript` in `apps/web/src/lib/theme-preference.ts`, retaining
  the valid values `"hs"` and `"skyss"`.
- `NavigationItem` and `NavigationLink` from
  `apps/web/src/components/navbar/navigation-items.ts`, with active matching
  derived from the existing localized pathname helper rather than hard-coded
  page labels.
- `EventSummary` and `EventCard` from
  `apps/web/src/features/events/components/EventCard.tsx`, with a small
  explicit presentation variant API shared by catalogue, promoted, and weekly
  surfaces.
- `Link` from `apps/web/src/i18n/navigation.ts` for localized internal event
  and navigation links.
- `HorizontalScrollRow` from
  `apps/web/src/app/[locale]/_components/HorizontalScrollRow.tsx` for the
  weekly section's existing horizontal interaction.
- `sanityImageUrl` and `shouldLoadImageDirectly` for Sanity image sizing and
  direct-loading behavior; poster artwork is not recolored.

Dependencies remain the versions already declared in the workspace. Do not
add another carousel, theme, font-runtime, or design-system dependency.
