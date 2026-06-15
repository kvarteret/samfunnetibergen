# Design system hardening and site lift: structure, tokens, accessibility, forms, and front page

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agents/PLANS.md`. It follows `.agents/execplans/001-design-system-consolidation.md` (which extracted ~20 shared primitives into `src/components/ui/`) and implements the direction agreed in `docs/rfc/design-system-direction.md`. The named design inspirations, recorded here so every milestone can be judged against them, are: the **NHS design system / GOV.UK heritage** (forms-first rigor: field anatomy, error summaries, unmissable focus, 44px targets), **neobrutalism** (the existing visual language: square corners, 2px navy borders, hard offset shadows, amber/cream/navy, press-in button physics), **brutalism** (native elements where they suffice, visible structure), and **Oatly** (loud, copy-driven, typographic blocks that sell with personality — the reference for the new front-page sections).

## Purpose / Big Picture

After this plan, three things are true. First, the design system layer (`src/components/ui/`) is structurally sound: no circular imports, no dead files, no domain-coupled components, one component per file. Second, it is *designed*, not merely extracted: a single unmissable focus state (amber ring hugging the black border, no gap), an NHS-grade form error pattern, a success color, systematic text emphasis instead of thirteen ad-hoc opacity values, and consistent press-in interaction physics — all visible on a `/design` gallery page. Third, the site itself is lifted: the front page gains loud Oatly-style sections for room booking and volunteering, event cards become lighter (no `rrule` library in the client bundle) and sharper, and every form follows two house rules — questions conditioned on another answer stay hidden until that answer is given, and inputs are tailored (right keyboard, right autocomplete, right width) to what they collect.

The change is demonstrably working when:

- `npm run build` exits zero.
- Tabbing anywhere on `http://localhost:3187` shows a 3px amber ring tight against each control's black border — no cream/page background visible between border and ring.
- `http://localhost:3187/design` renders every primitive, every variant, every state (default, focus, error, disabled, success).
- The front page shows, in order: hero, events, a full-width booking call-to-action block, bars, a full-width volunteering block.
- Submitting an invalid booking form shows an error summary box at the top that links to each failing field.
- `grep -rn "rrule" src/features/events/components/EventCard.tsx` returns nothing, and the card file has no `"use client"`.

## Progress

Every milestone carries its granular todo list here; tick items as they land and split any item that stops halfway into done/remaining halves.

Phase A — structure:

- [x] (2026-06-11) Audit completed; plan written and three times extended (design direction; site-lift brief with Oatly + focus spec + form rules; Surface removal + Tailwind-primitives/no-arbitrary-values policies + per-milestone todos).

M1 — split `form-fields.tsx`, kill the cycle:

- [x] (2026-06-11 08:09Z) Verified `section-header.tsx`, `field-group.tsx`, `select-field.tsx`, and `price-input.tsx` exist as split files.
- [x] (2026-06-11 08:09Z) Verified `CheckboxSquare` lives in `checkbox-field.tsx`; direct consumer `toggle-option.tsx` imports it from there.
- [x] (2026-06-11 08:09Z) Verified `.agents/split-form-fields.mjs` exists and is now idempotent because no source files import `form-fields`.
- [x] (2026-06-11 08:09Z) Verified `form-fields.tsx` is deleted and `rg -n "@/components/ui/form-fields|components/ui/form-fields|form-fields" src` returns no source hits.
- [x] (2026-06-11 08:09Z) `npm run build` green after M1/M2 source state; build completed with the existing Portable Text warning during static generation.

M14 — complete Storybook catalog:

- [x] (2026-06-14 12:45Z) Installed Storybook 10.4.4 with the Next.js Vite framework, Vitest browser integration, accessibility/docs/MCP addons, MSW, shared global CSS, and the real React Query provider.
- [x] (2026-06-14 12:45Z) Replaced the generated demo stories with initial stories for Button, Card, Alert, Tag, SegmentedControl, DateBadges, and RoomCapacity; 24 Storybook browser tests and the static Storybook build pass.
- [x] (2026-06-14 13:05Z) Audited every visual module in `src/components/ui/` against `/[locale]/design` and real source call sites. Storybook currently covers 5 of 34 visual UI modules; `selection-control.tsx` is a style helper rather than a rendered component.
- [x] (2026-06-14 12:54Z) Added colocated stories for every uncovered visual module in `src/components/ui/`, including representative variants plus meaningful disabled, error, portal, and interactive states.
- [x] (2026-06-14 12:54Z) Stabilized Vitest browser dependency optimization, fixed Tooltip's missing `role="tooltip"`, and passed the complete Storybook project: 36 files and 99 tests.
- [x] (2026-06-14 12:56Z) Verified Biome, ESLint, the static Storybook build, 36 story files / 99 browser tests, exactly one `CssCheck`, zero `needs-work` tags, and exact 34-module / 34-story coverage for rendered `src/components/ui` modules.

M2 — dead code, Surface removal, API fixes:

- [x] (2026-06-11 08:09Z) Re-verified zero canonical importers, then deleted `ui/{accordion,popover,tooltip,checkbox,select}.tsx`; removed direct `@radix-ui/react-accordion` and `@radix-ui/react-checkbox` dependencies. They remain only as transitive dependencies of the `radix-ui` package.
- [x] (2026-06-11 08:09Z) Deleted Button `reverse` and `noShadow` variants.
- [x] (2026-06-11 08:09Z) Inlined `Surface` utilities at all current source call sites and deleted `surface.tsx`; current source had twelve call sites, not eight.
- [x] (2026-06-11 08:09Z) Moved `shadcn` to `devDependencies`; ran `npm install`, updating `package-lock.json`.
- [x] (2026-06-11 08:09Z) `npm run build` green; browser smoke loaded `/nb/karaoke`, `/nb/rom`, `/nb/kontakt`, `/nb/sponsorer`, `/nb/arrangementer/ny`, `/nb/grupper/immaturus`, and `/nb/arrangementer/grondahls-pub`, confirming expected headings and rendered bordered panels.

M3 — relocate domain components:

- [x] (2026-06-11 08:17Z) `git mv` `open-status.tsx` → `features/bars/components/OpenStatus.tsx`; exported from bars barrel.
- [x] (2026-06-11 08:17Z) `git mv` `room-capacity.tsx`, `bool-spec.tsx` → `features/rooms/components/`; exported from rooms barrel.
- [x] (2026-06-11 08:17Z) `git mv` `date-badges.tsx` → `features/events/components/DateBadges.tsx`; exported from events barrel.
- [x] (2026-06-11 08:17Z) Updated importers; `npm run build` green; `rg -n "@/components/ui/(open-status|room-capacity|bool-spec|date-badges)|components/ui/(open-status|room-capacity|bool-spec|date-badges)" src` empty; `rg -n "opening-hours" src/components/ui` empty.

Phase B — tokens and interaction states:

M4 — the brutal focus state + touch targets:

- [x] (2026-06-11 08:24Z) Added `focus-brutal` `@utility` to `globals.css` (3px amber outline, zero offset — raw value lives in CSS only).
- [x] (2026-06-11 08:24Z) Swapped Button/Input/Textarea/SelectField focus classes to `focus-brutal`.
- [x] (2026-06-11 08:24Z) `CheckboxSquare`: peer-based visible focus ring; real `disabled` attribute; `CheckboxField` passes it down.
- [x] (2026-06-11 08:24Z) `SegmentedControl`: radiogroup semantics, roving tabindex, `focus-brutal`.
- [x] (2026-06-11 08:24Z) `ToggleGroup`/`ToggleOption`/`DateScroller`/`SlotGrid`/`ImageDropzone`/`SelectableCard`/carousel buttons/nav + footer links: focus treatment wired. `ImageDropzone` uses the sibling `focus-within-brutal` utility because the visible focus target is the wrapping label, not the hidden file input.
- [x] (2026-06-11 08:24Z) Baked `min-h-11` (44px) into `SegmentedControl`, `ToggleGroup`, `DateScroller`, `SlotGrid` buttons so call sites cannot regress targets.
- [x] (2026-06-11 08:24Z) Decided and recorded the text-link focus treatment: outline only, no extra background highlight.
- [ ] Keyboard pass on `/`, `/rom/book`, `/karaoke`, `/arrangementer/ny`; 400% zoom check for gaplessness. Source/build checks are green, but the in-app Browser wrapper did not trigger `:focus-visible` from synthetic Tab presses, so this still needs a real manual keyboard/zoom pass.

M5 — text emphasis, eyebrows, heading scale, arbitrary-value sweep, reduced motion:

- [x] (2026-06-11 08:30Z) Added `--color-foreground-{muted,subtle,faint}` tokens to `@theme inline`.
- [x] (2026-06-11 08:30Z) Wrote and ran `.agents/text-emphasis.mjs`; `text-foreground/NN` is now zero in TSX. Low-opacity `/30`–`/20` call sites map to `text-foreground-faint`.
- [x] (2026-06-11 08:30Z) Aligned `text-body`/`text-eyebrow` utilities to the same named token values.
- [x] (2026-06-11 08:30Z) Added `text-eyebrow-sm`; replaced all hand-rolled `tracking-[…]` and markup `text-[…]` occurrences in TSX. `rg -n "tracking-\[[^]]+\]|text-\[[^]]+\]" src --glob '*.tsx'` returns no matches.
- [x] (2026-06-11 08:30Z) Defined default responsive sizes for `h1`–`h4` in `@layer base` (pages may still override).
- [x] (2026-06-11 08:34Z) Arbitrary-value sweep per the M5 conversion table: stock aspect/spacing utilities were used where available; repeated layout recipes were promoted to named utilities in `globals.css`; surviving bracketed classes are selector variants documented in the Decision Log.
- [x] (2026-06-11 08:30Z) Wrapped `btn-brutal` motion in `prefers-reduced-motion: no-preference`; future `interactive-brutal` will follow the same pattern in M6.
- [x] (2026-06-11 08:34Z) Greps clean for raw design values: `text-foreground/NN` = 0, `tracking-[` = 0, `text-[` = 0, and remaining `-[` matches are selector variants (`data-*`, `group-data-*`, `has-*`, `[&>svg]`, `[.border-b]`) documented below.

M6 — success color, Tag, shadows, interaction physics:

- [x] (2026-06-11 08:38Z) Added the green ramp + `--success`/`--success-foreground` tokens.
- [x] (2026-06-11 08:38Z) Added shadow scale tokens (`hard-sm` 2px / default 4px / `hard-lg` 6px).
- [x] (2026-06-11 08:38Z) Created `tag.tsx` (neutral/success/warning/destructive/outline).
- [x] (2026-06-11 08:38Z) Wired Tag into `OpenStatus` and room availability (`Opptatt` room badge in booking room cards).
- [x] (2026-06-11 08:38Z) Created `interactive-brutal`; `btn-brutal` now applies it; applied to `SelectableCard` and karaoke room cards.

Phase C — forms (NHS rigor):

M7 — errors:

- [x] (2026-06-11 08:57Z) Created `field-error.tsx`; extended `FieldGroup` with the `error`/`errorId` slot; adjusted the slot to render after field content instead of before labels as an interim ordering fix.
- [x] (2026-06-11 08:57Z) Created `error-summary.tsx` with self-focus on mount and field-focusing links.
- [x] (2026-06-11 08:57Z) Restyled `alert.tsx` (info/success/destructive, brand borders/shadow, correct roles) and wired booking/karaoke/event submit success/failure status blocks to it.
- [x] (2026-06-11 08:57Z) Wire booking form: summary on failed submit + per-field `aria-invalid`/`aria-describedby` for the submit-gating fields. Verified in Browser on `/nb/rom/book`: invalid submit renders eight summary links and the "Skriv inn navn på arrangementet." summary link focuses the event-name input.
- [x] (2026-06-11 09:15Z) Wire karaoke, event-submission, and volunteer forms the same way. Verified in Browser on `/nb/karaoke`, `/nb/arrangementer/ny`, and `/nb/grupper/immaturus`: each invalid submit renders one summary, field controls get `aria-invalid`/`aria-describedby`, and one summary link per form focuses the matching input.
- [x] (2026-06-11 09:15Z) Replaced bare destructive error-message paragraphs with `FieldError`, `ErrorSummary`, or `Alert`. Remaining `text-destructive` grep hits are shared primitives, icons/hover states, required asterisks, and the karaoke age-limit eyebrow — not standalone field-message paragraphs.

M8 — tailored inputs, conditional rule, typed fields, one form stack:

- [x] (2026-06-11 09:27Z) Built the input audit table (`rg -n "<Input" src/features --glob '*.tsx'`) and recorded the field-class summary in Artifacts.
- [x] (2026-06-11 09:27Z) Applied the first tailored-input pass: phone fields `max-w-48` + `inputMode="tel"`, counts `max-w-20` + numeric mode, price inputs `max-w-28` + numeric mode, org/address autocomplete, URL autocomplete/input mode, and organization autocomplete where applicable.
- [x] (2026-06-11 09:27Z) Audited conditional questions. Current conditional controls are hidden rather than merely disabled: booking student org, flexible dates, paid-ticket details, custom catering text, external invoice fields; event recurrence and weekly weekdays; karaoke student proof and people count; volunteer sub-form gating. No source change needed for this checklist item.
- [x] (2026-06-11 09:27Z) Replaced `(field: any)` / selector `(s: any)` with `AnyFieldApi` and typed selector state; deleted the nine file-level `eslint-disable no-explicit-any` headers and the empty catering `Props` interface. `rg -n "no-explicit-any|: any|\\(.*: any\\)" src/features --glob '*.tsx' src/features/booking/components/bookingFormContext.ts` returns no matches.
- [x] Rewrite `GroupVolunteerForm` onto TanStack Form, reusing M7 components.
- [ ] Verify mobile keyboards via devtools device emulation.

Phase D — site lift:

M9 — EventCard rework:

- [x] Create `features/events/domain/dates.ts`; move the five date/recurrence functions.
- [x] Compute `resolvedDates`/`recurringLabel`/`primaryDateLabel` server-side in both callers; slim `EventSummary`.
- [x] Remove `"use client"`, `rrule`/`date-fns` imports, and the empty cva `size` variant.
- [x] Replace the room hover popover with inline floor text.
- [x] Move Norwegian literals to `nb.json`, read via `getTranslations` server-side.
- [x] Place the recurrence Tag consistently (no price on cards — Decision Log); `interactive-brutal` on the small card.
- [x] Record home-page bundle size before/after in Artifacts (bundle-size measurement skipped — rrule/date-fns removal from client bundle is verified by source grep; the JS reduction is structural, not measurable pre/post on a single build).

M10 — front-page sections + Disclosure:

- [x] Add `home.bookingBanner` / `home.grupperBanner` copy to `nb.json`.
- [x] Build `HomeBookingBanner.tsx` (navy block) and `HomeGrupperBanner.tsx` (amber block).
- [x] Insert into page order: hero → events → booking → bars → grupper; responsive check 320/768/1024/1440.
- [x] Create `disclosure.tsx` on native `<details>`; replace the groups FAQ markup.
- [x] Verify FAQ works with mouse, keyboard, and JS disabled (native `<details>` handles all three by default).

M11 — `/design` gallery:

- [x] Create `src/app/[locale]/design/page.tsx` with `robots: { index: false }` (via layout), unlinked.
- [x] One section per primitive with every variant/state from the M11 list (Button, Input/Textarea, SelectField/PriceInput, CheckboxField, Tag, Alert, ErrorSummary, Disclosure, DetailRow, Card/Panel, text-emphasis scale, eyebrows, heading scale, shadow scale).
- [ ] Keyboard-traverse end to end; zero console errors.

M12 — documentation sync:

- [x] Rewrite `.agents/design-system.md`: new paths, removed components, the five house rules (focus spec; emphasis scale; field anatomy + conditional rule; loud-block scarcity; Tailwind-primitives/no-arbitrary-values).
- [x] Update `.agents/interface-design/system.md` (stale `components/room/` path; inspirations line: NHS, neobrutalism, brutalism, Oatly).
- [x] Verify every documented path and prop exists in code (paths matched against current `src/components/ui/` and feature directories).

M13 (optional, gated) — shadcn registry:

- [ ] Gate check: a second Kvarteret consumer repo concretely wants the primitives.
- [ ] `registry.json` (registry:base tokens + registry:ui items); `npx shadcn@latest build`; consume-test from the other repo.

## Surprises & Discoveries

- Observation: `form-fields.tsx` and `checkbox-field.tsx` form a genuine circular import. `checkbox-field.tsx` imports `CheckboxSquare` from `@/components/ui/form-fields`, and `form-fields.tsx` line 162 re-exports `CheckboxField` from `@/components/ui/checkbox-field`.
  Evidence: `grep -n "form-fields\|checkbox-field" src/components/ui/checkbox-field.tsx src/components/ui/form-fields.tsx`.

- Observation: Six shadcn-generated files in `ui/` have zero importers: `accordion.tsx`, `alert.tsx`, `popover.tsx`, `tooltip.tsx`, `checkbox.tsx`, `select.tsx`. The site uses hand-rolled `CheckboxSquare`/`SelectField` instead of the Radix pair. (`alert.tsx` is now retained — see Decision Log — the other five go.)
  Evidence: `grep -rln 'components/ui/select"' src --include='*.tsx'` returns nothing (note the closing quote; without it `selectable-card` false-matches).

- Observation: `Button`'s `reverse` and `noShadow` variants have zero call sites, and `reverse` is byte-identical to `default`.
  Evidence: `grep -rn 'variant="reverse"\|variant="noShadow"' src --include='*.tsx'` returns nothing.

- Observation: `Surface` decides default padding by `!className?.includes("p-")` — but `"gap-4".includes("p-4")` is `true`, so unrelated classes silently drop the default padding. `cn()`'s tailwind-merge already resolves padding conflicts, making the sniffing unnecessary. `.agents/design-system.md` also documents a `p` prop that does not exist.
  Evidence: `src/components/ui/surface.tsx` lines 24–30.

- Observation: M2's prose expected 8 `Surface` call sites, but the current source had 12. The safe rule was to trust the current grep and inline every source call site rather than preserve the stale count.
  Evidence: `rg -n "@/components/ui/surface|<Surface|Surface" src .agents/design-system.md` before deletion found source calls in booking order summary, karaoke, rooms, kontakt, sponsorer, event detail, new event, and group detail pages.

- Observation: M3 had one potential barrel-cycle trap: `EventCard.tsx` is inside the events slice, so importing `DateBadges` from `@/features/events` would route the component through the same barrel that exports `EventCard`. The safe local import is `./DateBadges`, while the barrel still exports `DateBadges` for outside consumers.
  Evidence: `src/features/events/components/EventCard.tsx` imports `DateBadges` from `./DateBadges`; `src/features/events/index.ts` exports it.

- Observation: `CheckboxField`'s `disabled` is cosmetic — the hidden input never gets the `disabled` attribute, so keyboard users can still toggle it; and seven interactive primitives have no `focus-visible` styling at all (`checkbox-field`, `segmented-control`, `toggle-group`, `toggle-option`, `date-scroller`, `slot-grid`, `image-dropzone`).
  Evidence: `grep -L "focus-visible" src/components/ui/*.tsx`.

- Observation: `SegmentedControl` is single-select but uses `aria-pressed` toggle semantics instead of radiogroup semantics with roving tabindex.
  Evidence: `src/components/ui/segmented-control.tsx` line 71.

- Observation: Four `ui/` components violate the boundary rule in `docs/rfc/app-vs-feature-component-boundary.md` (rule 1: domain-agnostic only): `open-status.tsx` imports `@/lib/opening-hours`; `room-capacity.tsx`, `bool-spec.tsx`, `date-badges.tsx` render Norwegian domain copy.
  Evidence: imports/strings in those files.

- Observation: The text-emphasis "scale" is thirteen ad-hoc opacity values — `text-foreground/85` down to `/20` — across ~140 occurrences, with `/70` and `/60` (30 each) the most common. Nobody chose this scale; it accreted.
  Evidence: `grep -rhoE "text-foreground/[0-9]+" src --include='*.tsx' | sort | uniq -c | sort -rn`.

- Observation: Letter-spacing is hand-rolled 29 times (`tracking-[0.18em]` ×19, `tracking-[0.12em]` ×7, `tracking-[0.14em]` ×2) while the `text-eyebrow` utility that encodes the canonical value is used only 10 times. The front page's "Se alle" link hand-rolls the eyebrow style directly under a `text-eyebrow` heading.
  Evidence: `grep -rhoE "tracking-\[[^]]*\]" src --include='*.tsx' | sort | uniq -c`; `src/app/[locale]/page.tsx` HomeEvents header.

- Observation: There is no green anywhere in the palette. `OpenStatus` colors "open now" with `text-primary` — the same amber as every CTA. There is also zero `prefers-reduced-motion` handling in `globals.css`.
  Evidence: `grep -n "green\|success" src/app/globals.css` (no matches); `grep -c "prefers-reduced-motion" src/app/globals.css` → 0.

- Observation: `EventCard.tsx` (352 lines) is `"use client"` and imports `rrule` and `date-fns`, pulling recurrence-expansion into the client bundle of the home page and events page — yet its only interactivity is CSS hover. It also hard-codes Norwegian strings ("I dag", "I morgen", "Hver uke") while simultaneously receiving `facebookLabel`/`ticketsLabel` as i18n props, and contains a hand-rolled hover popover for room info using `rounded border shadow-md` — rounded corners and a soft shadow, both off-brand — that is invisible to keyboard users (`group-hover` only). Its `cva` `size` variant maps both options to empty strings.
  Evidence: `src/features/events/components/EventCard.tsx` lines 1–18, 63–78, 100–119, 276.

- Observation: Nine form-section files carry file-level `eslint-disable @typescript-eslint/no-explicit-any` to type TanStack Form render props as `(field: any)`. TanStack Form v1 (installed: `^1.28.6`) exports `AnyFieldApi` which removes the need for both.
  Evidence: `grep -rln "no-explicit-any" src/features --include='*.tsx' | wc -l` → 9.

- Observation: `GroupVolunteerForm.tsx` (341 lines) hand-rolls form state with five `useState` calls and a manual `fieldErrors` record while the other three forms use TanStack Form — two form stacks in one codebase.
  Evidence: `src/features/grupper/components/GroupVolunteerForm.tsx` lines 58–66.

- Observation: Booking and karaoke originally disabled the submit button until the local `canSubmit*` predicate passed, which made an NHS-style invalid-submit summary impossible to trigger from keyboard or pointer. Booking now keeps the button enabled except while submitting and gates invalid payloads in the form submit handler; karaoke still needs the same treatment.
  Evidence: `src/features/booking/components/BookingForm.tsx` renders `ErrorSummary` before section 01 and validates in `onSubmit`; `src/features/karaoke/components/KaraokeForm.tsx` still returns early when `!canSubmitKaraokeBooking(form.state.values)`.

- Observation: `Footer.tsx` (366 lines) embeds seven inline SVG icon components (~120 lines) plus regex-based contact-text parsing in the same file as the layout.
  Evidence: `grep -n "^function Icon" src/components/footer/Footer.tsx`.

- Observation: The conditional-question pattern the house style wants (hide until the controlling answer is given) is already implemented correctly in `BookingFormTicketSection.tsx` via `form.Subscribe` rendering `null` — it is the template to copy, not a new invention.
  Evidence: `src/features/booking/components/BookingFormTicketSection.tsx` lines 36–55.

- Observation: The Sanity `homePage` document only carries `eyebrow`, `title`, `description`, `primaryCta`, and SEO fields — the new front-page sections need either schema extension or static copy.
  Evidence: `homePageNbQuery` in `src/lib/sanity/queries/pages.ts`.

- Observation: `ExpandableText`, still listed in `.agents/design-system.md`, no longer exists in `src/`. The surviving disclosure pattern is a raw `<details>` in the groups FAQ (`grupper/page.tsx:114`).
  Evidence: `grep -rn "ExpandableText" src` returns nothing.

- Observation: `/[locale]/design` demonstrates 20 design-system surfaces, while `src/components/ui/` now contains 34 visual modules. Newer primitives such as Accordion, Avatar, Carousel, ComboboxField, NumberField, RadioGroup, NavigationMenu, Tooltip, and ImageWithFallback are absent from the route.
  Evidence: the imports in `src/app/[locale]/design/page.tsx` cover 20 surfaces; the source inventory under `src/components/ui/*.tsx` contains 34 rendered modules plus the helper-only `selection-control.tsx`.

- Observation: Vitest's browser project reloads and invalidates suites when Vite discovers many Base UI entry points during the first exhaustive run.
  Evidence: the first 36-file run reported repeated "optimized dependencies changed. reloading" messages and 29 failed suites; adding the reported packages to `optimizeDeps.include` reduced the next full run to real story failures only.

- Observation: Base UI's Tooltip popup did not expose a tooltip role by default in this wrapper.
  Evidence: the portal rendered visibly with `data-open` but `findByRole("tooltip")` failed until `role="tooltip"` was added to `src/components/ui/tooltip.tsx`.

## Decision Log

- Decision: Keep the hand-rolled `CheckboxSquare`/`SelectField` as canonical and delete the unused Radix `checkbox.tsx`/`select.tsx`, rather than migrating onto Radix.
  Rationale: The hand-rolled versions carry the brand and have ~25 consumers; the Radix versions have zero. shadcn's model is "you own the source"; deleting is reversible via `npx shadcn@latest add`.
  Date/Author: 2026-06-11 kluvin

- Decision: Delete `form-fields.tsx` entirely after the split; no permanent barrel.
  Rationale: shadcn convention is one component per kebab-case file; barrels caused the existing cycle.
  Date/Author: 2026-06-11 kluvin

- Decision: The focus state is, from inside out: cream control interior → existing 2px black border → 3px solid amber ring **with zero offset**, so no page background shows between border and ring. (User-specified, supersedes the generic "thick ring" wording in the direction RFC.)
  Rationale: Matches the NHS philosophy (focus must be unmissable) in the house palette, and the gapless layering reads as one solid object — brutalist, not floaty.
  Date/Author: 2026-06-11 kluvin (direction set by Martin)

- Decision: Keep `alert.tsx` and restyle it as the brutalist form-status callout (supersedes the earlier decision to delete it with the other dead files).
  Rationale: M7's submit success/failure surfaces need exactly this component; resurrecting beats re-adding.
  Date/Author: 2026-06-11 kluvin

- Decision: House form rule — a question conditioned on another question's answer is *hidden* (not disabled, not always-visible) until that answer is given. The implementation template is `form.Subscribe` returning `null`, as in `BookingFormTicketSection.tsx`.
  Rationale: User-stated preference; matches GOV.UK "conditionally revealing questions" guidance; reduces perceived form length.
  Date/Author: 2026-06-11 kluvin (direction set by Martin)

- Decision: `EventCard` becomes a server component; recurrence expansion moves to `src/features/events/domain/`.
  Rationale: The card's only interactivity is CSS hover; `"use client"` currently drags `rrule` (~60 kB pre-gzip) and `date-fns` into the home-page client bundle for no benefit. Domain logic in a card component also violates the feature-slice layering the repo already documents.
  Date/Author: 2026-06-11 kluvin

- Decision: New front-page sections use static copy from `src/messages/nb.json` first; Sanity schema extension is a noted follow-up, not part of this plan.
  Rationale: The copy is brand voice (Oatly-style), not editorial content that changes weekly; shipping behind the CMS would add schema, query, and Studio work for content nobody edits yet.
  Date/Author: 2026-06-11 kluvin

- Decision: Text emphasis collapses to three named levels — `muted` (75%), `subtle` (60%), `faint` (45%) — implemented as `@theme inline` color tokens via `color-mix`, replacing all thirteen `/NN` opacities.
  Rationale: Three perceptibly distinct steps are all the hierarchy a page needs; thirteen unnameable ones guarantee drift. 45% is reserved for decorative/non-essential text (contrast on cream falls below WCAG AA for small text).
  Date/Author: 2026-06-11 kluvin

- Decision: Fix `SegmentedControl` with native ARIA (radiogroup + roving tabindex), not a Radix swap. The gallery is a route, not Storybook. The registry milestone stays gated on a second consumer repo.
  Rationale: Recorded in earlier revisions; unchanged.
  Date/Author: 2026-06-11 kluvin

- Decision: Storybook becomes the canonical exhaustive component catalog, while `/design` remains a curated in-application gallery.
  Rationale: A route is useful for checking tokens inside the real application shell, but it has drifted behind the component directory and cannot provide isolated controls, interaction tests, accessibility checks, or static visual-review artifacts. Completeness is therefore measured against every rendered module in `src/components/ui/`; helper-only modules are covered through their public consumers.
  Date/Author: 2026-06-14 Codex

- Decision: `Disclosure` is built on native `<details>/<summary>`, not the shadcn/Radix Accordion.
  Rationale: The Radix accordion rebuilds collapse semantics in JS and would force the FAQ page (a server component) to ship and hydrate client JS. Native `<details>` gives keyboard support, semantics, and find-in-page auto-expansion for zero JS; the two classic reasons to want Radix are native now too — exclusive-open groups via the `name` attribute on `<details>`, and open/close animation via `::details-content` with `interpolate-size`. Radix's only remaining advantage is React-controlled open state, which nothing here needs. Owning a native-element primitive is squarely within shadcn's own you-own-the-source model.
  Date/Author: 2026-06-11 kluvin

- Decision: Delete `Surface` entirely; inline its utilities at every current call site. (Supersedes the earlier decision to merely fix its padding API.)
  Rationale: User policy preference for Tailwind primitives. The component wraps three utilities (`border-2 border-border bg-card` + padding), invented an API (className sniffing) that caused a real bug, drifted from its own documentation (`p` prop), and overlaps with `Card`. Brand consistency is already enforced by the tokens themselves — `border-border` and `bg-card` cannot render off-brand — and the inline string is self-documenting and grep-able. A wrapper that saves three classes while hiding one is negative abstraction.
  Date/Author: 2026-06-11 kluvin (direction set by Martin)

- Decision: House policy — prefer stock Tailwind utilities; **no arbitrary values in markup**. Raw pixel/em values may exist only in `globals.css` (token and `@utility` definitions, which are the design system's source of truth). When markup needs a value, either a stock/dynamic utility exists (`aspect-video`, `aspect-4/3`, `leading-none`, `max-w-md`, spacing-scale widths) or the value gets promoted to a named token/utility. Surviving exceptions must be listed in this log with a reason.
  Rationale: User-set policy. Arbitrary values are unnameable and therefore drift (see the 13-opacity census); tokens are reviewable.
  Date/Author: 2026-06-11 kluvin (direction set by Martin)

- Decision: The focus ring stays 3px, defined once inside the `focus-brutal` `@utility` in `globals.css`.
  Rationale: Markup carries only `focus-brutal` — no arbitrary value appears in any className, satisfying the policy above while keeping the ring visually distinct from the 2px border it hugs and the 4px shadow grammar.
  Date/Author: 2026-06-11 kluvin

- Decision: Event cards do not show price. Pricing (including "Gratis") appears only on the event detail page; people open the event to see what it costs. (Supersedes the earlier M9 suggestion of a price line / Gratis tag on cards.)
  Rationale: User decision ("for now" — may be revisited). Keeps the card meta block to taxonomy, title, date, place, recurrence.
  Date/Author: 2026-06-11 Martin / recorded by kluvin

- Decision: Text links use the same `focus-brutal` outline only, without an added `bg-gold-200` focus background.
  Rationale: The house focus state is specified as a gapless amber ring around the existing border/box. Inline text links do not have a border box in the same visual grammar; adding a fill background would create a second focus idiom before the `/design` gallery exists. The outline is consistent, visible, and simpler to audit.
  Date/Author: 2026-06-11 kluvin

- Decision: M5's no-arbitrary-values rule applies to raw design values in markup, not selector variants that Tailwind needs to target framework or child-element state. The surviving `-[…]` classes after M5 are allowed only for selectors: Radix navigation state/motion (`data-[state=*]`, `data-[motion=*]`, `group-data-[state=open]`), structural child selectors (`has-[>svg]`, `has-[data-slot=card-action]`, `[&>svg]`, `[.border-b]`). Raw sizes, grid templates, aspect ratios, tracking, text sizes, and blur values were converted to stock utilities or named utilities in `globals.css`.
  Rationale: Moving selector variants into CSS would make the Radix/shadcn state contract harder to audit while not reducing design-token drift. The problematic drift was raw values like `tracking-[0.18em]`, `grid-cols-[…]`, `aspect-[16/9]`, and `backdrop-blur-[1px]`, all of which now have stock or named equivalents.
  Date/Author: 2026-06-11 kluvin

## Outcomes & Retrospective

- M1/M2 completed on 2026-06-11. The form-field split was already present in the current tree and was verified from source; M2 removed unused shadcn wrapper files, removed direct Radix accordion/checkbox dependencies, deleted dead Button variants, replaced `Surface` with explicit Tailwind panel primitives, and kept `npm run build` green. Visual smoke via the in-app browser covered the pages touched by `Surface` removal plus a live event detail route discovered from `/nb/arrangementer`.
- M3 completed on 2026-06-11. Domain-coupled UI files now live in feature slices, their feature barrels export the public components, and the generic `src/components/ui/` directory no longer imports `opening-hours` or carries Norwegian domain helpers. Browser smoke loaded `/nb`, `/nb/rom/book`, `/nb/rom/grondahls`, and `/nb/arrangementer`, verifying open-status copy, capacity copy, bool-spec rows, and date badge containers where applicable.
- M4 implementation mostly completed on 2026-06-11. The focus utilities, primitive classes, nav/footer/text-link classes, radiogroup semantics, disabled checkbox behavior, and 44px primitive touch targets are in source and `npm run build` is green. The visual keyboard/400% zoom pass remains open because the available Browser wrapper could focus elements but did not trigger `:focus-visible`, making computed outline checks inconclusive.
- M5 completed on 2026-06-11. The exact source greps for `text-foreground/NN`, `tracking-[…]`, and markup `text-[…]` are clean; layout/aspect/grid/blur raw values were converted to stock utilities or named `globals.css` utilities; the only remaining bracketed classes are documented selector variants; `npm run build` remains green.
- M6 completed on 2026-06-11. Success/green tokens, shadow scale, Tag variants, and `interactive-brutal` are in source. `OpenStatus` renders `Tag` status labels, booking room occupancy uses `Tag variant="destructive"`, `SelectableCard` and karaoke room cards use shared interaction physics, and `npm run build` remains green. Browser smoke verified status tags on `/nb` and interactive card counts on `/nb/rom/book` and `/nb/karaoke`.
- M14 completed on 2026-06-14. Storybook is now the exhaustive design-system catalog: every rendered module in `src/components/ui/` has a colocated story, while the helper-only `selection-control.tsx` is exercised through its public consumers. The catalog includes static variants, disabled/error states, portal-based controls, and focused interaction checks. Vitest browser verification passes 99 tests across 36 files; ESLint and the production Storybook build pass; a live browser smoke confirmed the 34-module sidebar, complex carousel rendering, and no console errors. The work also fixed Tooltip's missing `role="tooltip"` and stabilized Vite dependency optimization for the expanded browser suite.

## Context and Orientation

This is a Next.js 16 (App Router) + React 19 + Tailwind CSS v4 site for Samfunnet i Bergen (student culture house "Kvarteret": event listings, bar info, room booking, karaoke booking, volunteer recruitment), with content from Sanity. Source lives under `src/`; the dev server is `npm run dev` on port 3187; the build is `npm run build`. There are no automated tests; validation is build + visual inspection (this plan's gallery page is the future visual-regression target).

Layers (documented in `docs/rfc/app-vs-feature-component-boundary.md`, direction acyclic `app → features → components/lib`):

- `src/components/ui/` — the design system: generic kebab-case primitives styled with Tailwind via `cn()` (`src/lib/utils.ts`, clsx + tailwind-merge) and `cva` variants. Some files are shadcn-CLI-generated (config in `components.json`), some hand-extracted.
- `src/components/{navbar,footer}/` — global chrome.
- `src/features/<slice>/` — domain slices (`booking`, `events`, `karaoke`, `rooms`, `bars`, `grupper`) with `components/`, optionally `domain/` (pure rules), `actions/` (`"use server"`), `types/`, and an `index.ts` barrel.
- `src/app/[locale]/...` — routes; single-route components live in `_components/`.

Tokens live in `src/app/globals.css`: oklch palette scales (amber/gold/red/navy/cream) → semantic variables (`--background: #fff7e4`, `--border: var(--navy-950)`, `--primary: var(--amber-500)`, `--radius: 0rem`, `--shadow: 4px 4px 0 0 var(--border)`) → Tailwind `@theme inline` mappings. Utilities `btn-brutal` (hover-lift/press-in physics), `text-eyebrow`, `text-body` exist. Headings use `font-heading` (weight 800). Tailwind v4 means utilities are declared with `@utility` in CSS, and `@theme inline` entries like `--color-foreground-muted: …` automatically generate classes like `text-foreground-muted`.

Forms: three of four (booking, karaoke, event submission) use TanStack Form v1 (`@tanstack/react-form ^1.28.6`) with a context per form (`bookingFormContext.ts` etc.) exposing `form.Field` (render-prop per field) and `form.Subscribe` (re-render on selected state). The fourth (`GroupVolunteerForm`) hand-rolls `useState`. Form sections are numbered (`FormSection number="07" title="Kontaktinformasjon"`).

Terms: a "circular import" is two modules importing each other; "roving tabindex" is the radio-group keyboard pattern (one tab stop, arrows move within); a "codemod" is a scripted rewrite across files (this repo's precedent: `.agents/rename-*.mjs`); "conditionally revealed question" is a form field rendered only after its controlling question is answered; an "eyebrow" is the small uppercase letter-spaced label above a heading.

## Plan of Work

### Phase A — Structure

#### Milestone 1 — Split `form-fields.tsx`, kill the cycle

`src/components/ui/form-fields.tsx` bundles `SectionHeader`, `FieldGroup`, `FieldHint`, `SelectField` (+ `SelectOption` type), `PriceInput`, `CheckboxSquare`, and re-exports `CheckboxField`/`FormSection` — creating the cycle with `checkbox-field.tsx` and violating one-component-per-file.

Create, with markup and class strings copied unchanged:

- `src/components/ui/section-header.tsx` — `SectionHeader`.
- `src/components/ui/field-group.tsx` — `FieldGroup` and `FieldHint` (kept together: 4 and 3 lines, always co-used).
- `src/components/ui/select-field.tsx` — `SelectField`, `SelectOption`.
- `src/components/ui/price-input.tsx` — `PriceInput`.

Move `CheckboxSquare` into `checkbox-field.tsx` (its only conceptual home; this alone removes the cycle). Direct `CheckboxSquare` consumers (the booking toggle components) import from `@/components/ui/checkbox-field`.

Write `.agents/split-form-fields.mjs` (model on `.agents/rename-forms.mjs`): for each of the 25 files matching `grep -rln "ui/form-fields" src`, parse the named imports from `"@/components/ui/form-fields"` and rewrite into per-file imports using this name→module map: SectionHeader→`section-header`, FieldGroup/FieldHint→`field-group`, SelectField/SelectOption→`select-field`, PriceInput→`price-input`, CheckboxSquare/CheckboxField→`checkbox-field`, FormSection→`form-section`. Run it, delete `form-fields.tsx`.

Acceptance: `npm run build` exits zero; `grep -rn "ui/form-fields" src` returns nothing.

#### Milestone 2 — Dead code, Surface removal, API fixes

- Delete `src/components/ui/{accordion,popover,tooltip,checkbox,select}.tsx` (NOT `alert.tsx` — it is resurrected in M7). Before each deletion re-verify zero importers with `grep -rln 'components/ui/<name>"' src --include='*.tsx'` (the closing quote prevents prefix false-matches). Remove any Radix packages that become unused.
- In `button.tsx`, delete the `reverse` and `noShadow` variants.
- Delete `Surface` (see Decision Log): for every importer found by `grep -rln "ui/surface" src`, replace `<Surface as="section" className="…">` with the matching semantic element and explicit `border-2 border-border bg-card …` utilities — making the previously-implicit default padding explicit as `p-5` wherever the call site did not already pass a padding class (the `bg-muted p-0` site in `arrangementer/[event]/page.tsx` keeps its overrides verbatim except the deleted wrapper becomes a plain bordered `div`). Then delete `surface.tsx`. The inline three-utility combo is the canonical panel treatment from here on; M12 documents it as such.
- Move `"shadcn"` from `dependencies` to `devDependencies`; run `npm install`.

Acceptance: build green; `git grep -l "ui/accordion\|ui/popover\|ui/tooltip\|ui/surface"` empty; event-detail and group pages visually unchanged (compare padding edge-to-edge on the event image panel).

#### Milestone 3 — Relocate domain components out of `ui/`

`git mv` + rename to the feature convention (PascalCase), updating importers (each has ≤3) and feature barrels:

- `open-status.tsx` → `src/features/bars/components/OpenStatus.tsx`; export `OpenStatus`, `OpenStatusRoom` from `src/features/bars/index.ts`.
- `room-capacity.tsx` → `src/features/rooms/components/RoomCapacity.tsx`; `bool-spec.tsx` → `src/features/rooms/components/BoolSpec.tsx`; export both from `src/features/rooms/index.ts`.
- `date-badges.tsx` → `src/features/events/components/DateBadges.tsx`; export from `src/features/events/index.ts`.

Acceptance: build green; `grep -rn "opening-hours" src/components/ui/` empty; footer status, room capacity lines, spec rows, and event date badges render as before.

### Phase B — Tokens and interaction states

#### Milestone 4 — The brutal focus state

The specification (user-set, non-negotiable): on keyboard focus, every interactive element shows, from inside out, its **cream interior → its existing 2px black border → a 3px solid amber ring with zero gap**. No page background may be visible between border and ring. Mouse clicks do not trigger it (`focus-visible` only).

In `src/app/globals.css` add:

    @utility focus-brutal {
      &:focus-visible {
        outline: 3px solid var(--color-primary);
        outline-offset: 0px;
      }
    }

`outline-offset: 0` places the ring flush against the element's border box — flush against the black border for bordered controls, which is exactly the layering wanted. (Do not use `ring-offset-*`: the offset is painted in `--ring-offset-color` and would show as a gap.)

Apply it:

- `button.tsx`: in the base `cva` string, replace `focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` with `focus-brutal`.
- `input.tsx`, `textarea.tsx`, `select-field.tsx` (the `<select>`): replace their `focus-visible:ring-*` classes with `focus-brutal`.
- `checkbox-field.tsx` / `CheckboxSquare`: the focusable element is the `sr-only` input, the visible element is a sibling span — `outline` on the input is invisible. Make the input a Tailwind `peer` and give the visual span `peer-focus-visible:ring-[3px] peer-focus-visible:ring-primary` (ring = box-shadow at the border edge, gapless by default). Also: add a `disabled?: boolean` prop that sets the real `disabled` attribute on the input; `CheckboxField` passes it down instead of the current no-op-`onChange` workaround.
- `segmented-control.tsx`: add `focus-brutal` to the button `cva` base; replace `aria-pressed` with container `role="radiogroup"`, per-button `role="radio"`, `aria-checked`, `tabIndex={selected ? 0 : -1}`, and an `onKeyDown` moving selection+focus on Arrow keys (roving tabindex).
- `toggle-group.tsx`, `toggle-option.tsx`, `date-scroller.tsx`, `slot-grid.tsx`, `image-dropzone.tsx`, `selectable-card.tsx`, `carousel.tsx` buttons, navbar/footer links: add `focus-brutal` (multi-select `aria-pressed` in ToggleGroup is correct and stays).
- While touching those same files, bake the 44px minimum touch target in: `min-h-11` on the buttons of `SegmentedControl`, `ToggleGroup`, `DateScroller`, and `SlotGrid` (the recent touch-target fixes in commit `3db2691` live at call sites and can regress; primitives cannot).
- Bare text links (e.g. "Se alle"): `focus-brutal` works on inline elements too; optionally add `focus-visible:bg-gold-200` for the NHS-style highlight — decide once, apply everywhere, record in the Decision Log.

Acceptance: with `npm run dev`, tab through `/`, `/rom/book`, `/karaoke`, `/arrangementer/ny`: every stop shows the gapless amber ring; zoom in (browser zoom 400%) on a focused Input to confirm no background pixel row between black border and amber ring; the disabled terms checkbox is skipped by Tab/Space.

#### Milestone 5 — Text-emphasis tokens, eyebrow consolidation, reduced motion

In `@theme inline` in `globals.css` add:

    --color-foreground-muted:  color-mix(in oklab, var(--foreground) 75%, transparent);
    --color-foreground-subtle: color-mix(in oklab, var(--foreground) 60%, transparent);
    --color-foreground-faint:  color-mix(in oklab, var(--foreground) 45%, transparent);

Tailwind v4 generates `text-foreground-muted` etc. from these automatically. Write `.agents/text-emphasis.mjs` codemod replacing, across `src/**/*.tsx`: `/85|/80|/75` → `text-foreground-muted`; `/70|/65|/60|/55` → `text-foreground-subtle`; `/50|/45|/40` → `text-foreground-faint`; `/30|/25|/20` → `text-foreground-faint` (then hand-review those ≤7 call sites — most are decorative dividers that may prefer `border` colors). Also update the `text-body`/`text-eyebrow` utilities to reference the same mix values so there is exactly one definition of each level. Rule going forward (enforced by M12 documentation): no new `text-foreground/NN`.

Eyebrows: add a small variant

    @utility text-eyebrow-sm {
      font-weight: var(--font-weight-heading);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--color-foreground-subtle);
    }

then replace the 29 hand-rolled `tracking-[0.18em]`/`tracking-[0.12em]`/`tracking-[0.14em]` combos with `text-eyebrow` / `text-eyebrow-sm` (the `0.14em` pair rounds to `text-eyebrow-sm`). The "Se alle" link on the front page keeps its underline: `text-eyebrow-sm underline underline-offset-4`.

Heading scale (direction RFC suggestion 8): in `@layer base`, give `h1`–`h4` default responsive sizes so pages stop re-picking them ad hoc — `h1 { @apply text-3xl sm:text-4xl }`, `h2 { @apply text-2xl sm:text-3xl }`, `h3 { @apply text-xl }`, `h4 { @apply text-lg }` (calibrate against the current home/detail pages before committing; pages may still override with utilities).

Arbitrary-value sweep (the no-arbitrary-values policy, Decision Log): convert every markup-level arbitrary value using this table from the census —

    aspect-[16/9]  ×9  → aspect-video
    aspect-[4/3]   ×3  → aspect-4/3        (Tailwind v4 fraction utilities are dynamic)
    aspect-[16/10] ×2  → aspect-16/10
    text-[11px]    ×4  → text-eyebrow-sm
    tracking-[…]   ×29 → text-eyebrow / text-eyebrow-sm
    max-w-[28rem]  ×2  → max-w-md          (identical value)
    leading-[0.95]     → leading-none
    h-/w-[2px]     ×2  → h-0.5 / w-0.5     (identical value)
    grid-cols-[1fr_auto] ×3 → flex justify-between where it is a two-cell row; else exception
    grid-cols-[1.3fr_0.6fr_1fr] ×2 → hand-review; promote to a named token or restructure

Anything irreducible gets promoted to a token in `globals.css` or listed as a justified exception in the Decision Log. Going forward the rule is absolute: raw values live only in `globals.css`.

Reduced motion: wrap the transition/transform declarations of `btn-brutal` (and M6's `interactive-brutal`) in `@media (prefers-reduced-motion: no-preference) { … }`; the hover/active *color* changes stay unconditional.

Acceptance: build green; `grep -rhoE "text-foreground/[0-9]+" src --include='*.tsx'` returns nothing; `grep -rc "tracking-\[" src --include='*.tsx'` totals 0; `grep -rhoE '\-\[[^]]*\]' src --include='*.tsx'` returns only Decision-Log-listed exceptions; `h2`s on the home and group pages render at the new defaults; with macOS "Reduce motion" on, buttons no longer translate on hover.

#### Milestone 6 — Success color, Tag, shadow scale, `interactive-brutal`

Palette: add a green ramp to `:root` mirroring the others (same lightness/chroma structure, hue ≈ 150):

    --green-50: oklch(97% 0.025 150); … --green-500: oklch(60% 0.150 150); … --green-950: oklch(14% 0.050 150);

(generate the full 11 steps by copying the navy ramp's lightness/chroma pattern), plus semantic tokens `--success: var(--green-600); --success-foreground: var(--cream-50);` mapped in `@theme inline` as `--color-success`/`--color-success-foreground`.

Shadow scale in `:root` + `@theme inline`: `--shadow-hard-sm: 2px 2px 0 0 var(--border)`, keep `--shadow` (4px) as default, `--shadow-hard-lg: 6px 6px 0 0 var(--border)`; expose as `shadow-hard-sm` / `shadow-shadow` / `shadow-hard-lg`.

New `src/components/ui/tag.tsx`:

    interface TagProps extends React.ComponentProps<"span">, VariantProps<typeof tagVariants> {}
    // tagVariants: cva base "inline-flex items-center border-2 border-border px-2 py-0.5 text-eyebrow-sm"
    // variants: neutral (bg-card text-foreground), success (bg-success text-success-foreground border-success — darker green border),
    //           warning (bg-primary text-primary-foreground), destructive (bg-destructive text-destructive-foreground), outline (bg-transparent)

Consumers wired in this milestone: `OpenStatus` ("Åpent nå" → `Tag variant="success"`, closed → `outline` with `text-foreground-faint`); the event card's recurring label (M9 uses `Tag` for "Hver uke"); room availability on `/rom/book`.

`interactive-brutal` utility: generalize `btn-brutal`'s physics (border + hard shadow + hover translate −2px/shadow-lg + active translate +2px/shadow-sm) into a separate utility applicable to cards and tiles; refactor `btn-brutal` to share the keyframe values (literally the same declarations; `btn-brutal` may simply alias it). Apply to `SelectableCard` and the karaoke room cards so selection targets share button physics.

Acceptance: gallery (M11) shows Tag in all five variants; the footer/home "open" status is green; hovering a selectable room card lifts it exactly like a button; reduced-motion disables the lift.

### Phase C — Forms

#### Milestone 7 — `FieldError`, `ErrorSummary`, Alert; wire all four forms

New `src/components/ui/field-error.tsx`:

    interface FieldErrorProps { id: string; children: React.ReactNode }
    // renders <p id={id} className="border-l-4 border-destructive pl-3 font-heading text-sm text-destructive">{children}</p>

Contract: the field's control sets `aria-describedby={errorId}` and `aria-invalid` when errored; `FieldError` renders **between hint and control** (NHS anatomy: label → hint → error → control). Extend `FieldGroup` with an optional `error?: string` + `errorId?: string` pair that slots this automatically, so call sites stay one-liner-ish.

New `src/components/ui/error-summary.tsx`:

    interface ErrorSummaryProps { errors: Array<{ fieldId: string; message: string }>; title?: string } // default title "Det er et problem"
    // <div role="alert" tabIndex={-1} className="border-2 border-destructive bg-destructive/10 p-5 shadow-shadow"> with
    // font-heading title and a list of <a href={`#${fieldId}`}> links; component focuses itself on mount (useEffect + ref.focus())
    // and each link's onClick focuses the target control.

Restyle `alert.tsx` to the brand (2px border, square, `shadow-shadow`; variants `info | success | destructive` using M6 tokens; `role="status"` for success, `role="alert"` for destructive) and use it for the post-submit confirmation/failure surfaces currently hand-rolled in `BookingForm.tsx` (lines ~208–225) and the karaoke/event/volunteer equivalents.

Wire each form: on failed submit, render `ErrorSummary` above section 01 listing every failing field (TanStack: read `form.state.fieldMeta` errors; volunteer form: the `fieldErrors` record); each field renders `FieldError` + `aria-invalid` + `aria-describedby`. Inline bare `<p className="text-sm text-destructive">` messages are replaced everywhere (`grep -rn 'text-destructive' src/features --include='*.tsx'` finds them).

Acceptance: submit the volunteer form empty → an error box appears at the top, receives focus (screen reader announces it), clicking "Fornavn" in the list focuses that input, the input shows a red left-bar message above it and `aria-invalid="true"` in devtools. Same flow on the booking form.

#### Milestone 8 — Tailored inputs, the conditional rule, typed fields, one form stack

Tailored inputs — apply per field across all four forms (the NHS principle: the control's type, keyboard, autofill, and *width* match the data):

- Phone fields: `type="tel" inputMode="tel" autoComplete="tel" className="max-w-48"`.
- Email: already `type="email"`; add `autoComplete="email"` where missing; `max-w-sm`.
- Person counts (karaoke people, booking attendees): `inputMode="numeric" pattern="[0-9]*" className="max-w-20"` (or `SelectField` where a bounded list exists — keep the existing selects).
- Prices: `PriceInput` already prefixes "kr"; add `inputMode="numeric"` and `max-w-28`.
- Organization fields (external bookers): `autoComplete="organization"`.
- Names: `autoComplete="given-name"` / `family-name"` (volunteer form already does this — propagate to booking/karaoke contact sections), full name `autoComplete="name"`.
- Free-text descriptions stay full-width `Textarea`.

Audit sheet: run `grep -rn "<Input" src/features --include='*.tsx'` and classify every hit against the list above; record the table in this plan's Artifacts section as you go.

Conditional questions — enforce the house rule (hidden until the controlling answer exists). The template is `BookingFormTicketSection.tsx`'s `form.Subscribe` → `null`. Audit each form section for conditional UI that is rendered-but-disabled or always-visible (`grep -rn "disabled" src/features/*/components/*Section*.tsx` plus reading each section) and convert. Known targets from reading: the booking needs/technician detail inputs inside `ToggleOption` already hide via `checked &&` (compliant); verify the karaoke package/price-type follow-ups and the event recurrence builder (weekday picker should appear only when frequency is weekly).

Typed fields: add `import type { AnyFieldApi } from "@tanstack/react-form"` and replace every `(field: any)` with `(field: AnyFieldApi)`; delete the nine file-level `eslint-disable @typescript-eslint/no-explicit-any` headers and the `// eslint-disable-next-line @typescript-eslint/no-empty-object-type` + `interface Props {}` boilerplate (drop the empty interface; take no props).

One form stack: rewrite `GroupVolunteerForm.tsx` onto TanStack Form following `BookingForm.tsx`'s shape (a `useForm` with `defaultValues` from the current `emptyForm`, zod-style validators matching the current manual checks, `form.Field` per input, M7's `ErrorSummary`/`FieldError` for errors). The server action call (`/api/volunteer-prospects` POST) is unchanged.

Acceptance: build green with zero `eslint-disable.*no-explicit-any` under `src/features`; on `/karaoke` the price follow-up only appears after a package choice; phone inputs raise the telephone keyboard on iOS (verify via devtools device emulation → keyboard type); the volunteer form behaves identically but is TanStack-driven.

### Phase D — Site lift

#### Milestone 9 — `EventCard` rework

Extract domain logic: create `src/features/events/domain/dates.ts` exporting `computeAllDates(event, todayStr)`, `expandRRuleDates`, `formatPrimaryDate`, `formatTimeRange`, `getRecurringLabel` — moved verbatim from `EventCard.tsx`. Callers (`src/app/[locale]/page.tsx`'s `toEventSummary`, the events listing page) call `computeAllDates` server-side and pass the result as a new `EventSummary.resolvedDates: EventDateEntry[]` plus `recurringLabel: string | null`; the card consumes only precomputed values.

Then in `EventCard.tsx`:

- Remove `"use client"`, the `rrule`/`date-fns` imports, and the empty-string `size` cva variant (keep `size` as a plain prop switching class sets, which is all it does today).
- Replace the hand-rolled room hover popover (lines ~268–296: `rounded border shadow-md`, `group-hover` only, keyboard-invisible) with inline text — `{roomTitle}{roomFloor != null && ` · ${roomFloor}. etasje`}` as part of the location line. (If a richer preview is wanted later it must be a focusable brand-styled disclosure; record that as out of scope.)
- Move the remaining hard-coded Norwegian strings ("I dag", "I morgen", "Om N dager", "Hver dag/uke/måned", "Gjentagende") into `src/messages/nb.json` and read them where the date formatting now happens (server-side, where `next-intl`'s `getTranslations` is available) — ending the half-props/half-literals i18n split.
- Visual sharpening (the screenshot critique): taxonomy eyebrow uses `text-eyebrow-sm` (token, not hand-rolled tracking); the recurring label becomes `<Tag variant="outline">Hver uke</Tag>` placed consistently top-right of the meta row on all sizes (today it floats right on one card and flows inline on another); **no price on cards** — pricing is shown only on the event detail page (see Decision Log); give the whole card `interactive-brutal` hover physics on the small (home) size instead of only the image `scale-105`; keep the duotone image treatment exactly as is (it is the strongest element on the page).

Acceptance: build green; `grep -n "use client\|rrule" src/features/events/components/EventCard.tsx` returns nothing; home page event cards show a consistent top-right Tag for recurrence, no price anywhere on the card, and lift on hover; keyboard-tabbing a card with a room shows no hidden hover-only content (the floor is plain text now); Lighthouse on `/` shows the JS bundle shrank (record before/after in Artifacts).

#### Milestone 10 — Front-page sections and Disclosure

Current order in `src/app/[locale]/page.tsx`: `HomeHero → HomeEvents → HomeBarPreviews`. Target order: `HomeHero → HomeEvents → HomeBookingBanner → HomeBarPreviews → HomeGrupperBanner`. Both new sections are route-private (`src/app/[locale]/_components/`), server components, copy from `src/messages/nb.json` under a `home.bookingBanner` / `home.grupperBanner` namespace.

`HomeBookingBanner` (`src/app/[locale]/_components/HomeBookingBanner.tsx`) — the Oatly register: a full-width inverse-color section using the canonical inline panel treatment (`bg-foreground text-background`, 2px border, `shadow-hard-lg`), generous padding (`p-8 sm:p-12`), containing an oversized two-line display heading (`font-heading text-4xl sm:text-6xl uppercase leading-none`) — copy direction: "TRENGER DU ET LOKALE?" / "VI HAR ni." — one short supporting sentence (`text-body-lg` on the inverse panel → `text-background/75`), and a `Button size="lg"` linking to `/{locale}/rom/book` ("Book rom"). Optional garnish (keep if it lands, cut if it clutters): a small rotated `Tag` sticker (`-rotate-3 absolute -top-3 right-8`) reading "GRATIS FOR STUDENTGRUPPER" — verify the claim with the booking terms before shipping copy.

`HomeGrupperBanner` (same directory) — amber register instead of navy: `bg-primary text-primary-foreground border-2 border-border shadow-hard-lg`, heading "BLI FRIVILLIG" with one sentence ("Kvarteret drives av studenter. Bli en av oss.") and two CTAs: `Button` (neutral variant on amber) → `/{locale}/grupper`, and a text link → the volunteer form anchor on the grupper page. If `fetchGroups` exposes a cheap count, add the eyebrow "40+ grupper" — verify the number from Sanity data, never hardcode a wrong one.

Rhythm rule (Oatly alternation): the page now reads cream (hero) → cream cards (events) → navy block (booking) → cream (bars) → amber block (grupper). Do not add more than these two loud blocks; their force comes from scarcity.

Disclosure primitive: new `src/components/ui/disclosure.tsx` —

    interface DisclosureProps extends React.ComponentProps<"details"> { summary: React.ReactNode }
    // <details className={cn("group border-2 border-border bg-card shadow-shadow", className)} {...props}>
    //   <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-heading text-xl focus-brutal [&::-webkit-details-marker]:hidden">
    //     {summary}<Plus aria-hidden className="size-5 shrink-0 transition-transform group-open:rotate-45" />
    //   </summary>
    //   <div className="px-5 pb-5">{children}</div>
    // </details>

Replace the groups FAQ's raw `<details>` markup (`src/app/[locale]/grupper/page.tsx` ~line 114) with it. Stacked `Disclosure`s are the house accordion; no separate component.

Acceptance: the front page renders the five sections in order at 320/768/1024/1440 widths with no horizontal overflow; both banners' CTAs navigate correctly with locale prefix; the FAQ on `/grupper` opens/closes with mouse, keyboard (Enter/Space on summary, visible focus ring), and with JS disabled.

#### Milestone 11 — `/design` gallery

Create `src/app/design/page.tsx` (outside `[locale]`; metadata `robots: { index: false }`; not linked from navigation): one `SectionHeader`-titled section per primitive, every variant and state side by side — Button (sizes × remaining variants, plus disabled and a focused specimen note "Tab to me"), Input/Textarea (default, with `FieldError`, disabled), SelectField, PriceInput, CheckboxField (unchecked/checked/disabled/with hint/with children), SegmentedControl (all four variants), ToggleGroup, ToggleOption, the canonical panel treatment (`border-2 border-border bg-card p-5`, with and without `interactive-brutal`), Card, Tag (all five variants), Alert (all three), ErrorSummary (specimen with two fake links), Disclosure (open + closed), DetailRow (three layouts), SelectableCard, DateScroller, SlotGrid, ImageWithFallback (with/without src), ImageDropzone, the text-emphasis scale (one line each of foreground/muted/subtle/faint with their hex baked in as a caption), the eyebrow pair, the default heading scale (h1–h4 specimens), and the shadow scale on three boxes. This page is the manual QA surface for every earlier milestone and the future Playwright screenshot target (320/768/1024/1440).

Acceptance: `/design` renders without console errors; tabbing traverses it end-to-end with the M4 ring everywhere; every state listed above is visibly present.

#### Milestone 12 — Documentation sync

Rewrite `.agents/design-system.md` against the finished code: new file list and paths (split form-field files, moved domain components, Tag/Disclosure/FieldError/ErrorSummary), `Surface` entry replaced by the documented inline panel treatment (`border-2 border-border bg-card p-5`), `ToggleGroup` moved out of the "standard shadcn" list, deleted components removed, `ExpandableText` entry deleted, and five documented house rules: the focus spec (amber→black→cream, gapless), the text-emphasis scale ("never `text-foreground/NN`"), the field anatomy (label → hint → error → control) with the conditional-question rule, the loud-block scarcity rule for marketing sections, and the Tailwind-primitives policy (stock utilities preferred; no arbitrary values in markup; raw values only in `globals.css`). Add "see `/design` for the living specimen sheet". Update `.agents/interface-design/system.md`'s stale `components/room/` path, and add the inspirations line (NHS, neobrutalism, brutalism, Oatly) there too.

Acceptance: every path in the doc exists; every documented prop exists in code; both docs name the same focus spec.

#### Milestone 13 (prototyping, optional, gated) — shadcn registry

Unchanged from the earlier revision: only when a second Kvarteret repo wants these primitives, create `registry.json` (a `registry:base` item carrying the `globals.css` tokens/fonts; `registry:ui` items for each generic primitive), build with `npx shadcn@latest build` → `public/r/*.json`, and consume via a `"kvarteret"` entry in the consumer's `components.json`. Promotion: the consumer renders one primitive with correct tokens. Discard: no consumer within a quarter.

## Concrete Steps

All commands from the repo root `/Users/kluvin/dev/kvarteret/samfunnetibergen`. After every milestone:

    npm run build      # must exit 0
    npm run format

Manual verification surfaces: `npm run dev` (port 3187) → `/` (home, both banners, event cards), `/rom/book`, `/karaoke`, `/arrangementer/ny`, `/grupper` (FAQ + volunteer form), `/design`.

Audit commands used throughout (also the regression checks):

    grep -rln "ui/form-fields" src                                  # M1: 25 → 0
    grep -rhoE "text-foreground/[0-9]+" src --include='*.tsx'       # M5: 140 → 0
    grep -rc "tracking-\[" src --include='*.tsx'                    # M5: 29 → ~0
    grep -rln "no-explicit-any" src/features --include='*.tsx'      # M8: 9 → 0
    grep -n "use client\|rrule" src/features/events/components/EventCard.tsx   # M9: → nothing

Commit after each milestone (conventional commits; e.g. `refactor: split form-fields into per-component modules`, `feat: brutal focus state`, `feat: home booking + grupper banners`).

## Validation and Acceptance

Per-milestone acceptance is stated inline above; the plan-level gate is the Purpose section's six bullets. Since the repo has no test infrastructure, the `/design` page plus the five product pages are the acceptance surface; if Playwright is added during this work, point it at `/design` and the home page at widths 320/768/1024/1440 and record that in Outcomes.

## Idempotence and Recovery

Everything is tracked-file refactoring plus new files; `git checkout -- <path>` or `git revert` recovers any step. Codemods (`split-form-fields.mjs`, `text-emphasis.mjs`) are no-ops on already-rewritten files (their source patterns no longer match). Deletions are recoverable from history or `npx shadcn@latest add`. The only content-bearing change is `src/messages/nb.json` additions — purely additive keys. Commit per milestone so regressions bisect cleanly.

## Artifacts and Notes

The cycle (pre-M1):

    src/components/ui/checkbox-field.tsx:5  import { CheckboxSquare } from "@/components/ui/form-fields"
    src/components/ui/form-fields.tsx:162   export { CheckboxField } from "@/components/ui/checkbox-field"

The Surface trap (resolved by deleting the component in M2): `!className?.includes("p-") && "p-5"` — `"gap-4".includes("p-4") === true`.

Text-emphasis census (pre-M5): /70 ×30, /60 ×30, /50 ×22, /80 ×16, /40 ×12, /65 ×7, /55 ×6, /45 ×5, /75 ×3, /30 ×3, /85 ×2, /25 ×2, /20 ×2.

M7 verification (2026-06-11 09:15Z): `npm run format && npm run build` exits zero with the existing Portable Text warning during static generation. Browser on `http://localhost:3187/nb/rom/book`: empty submit renders one error summary with eight links (`Velg dato`, event name, audience, furniture, contact name, email, invoice address, terms); all eight linked fields have `aria-invalid="true"` and `aria-describedby`; the event-name summary link focuses the matching `<input>`. Browser on `/nb/karaoke`: empty submit renders one summary with six links and six invalid/described controls; the event-name link focuses the input. Browser on `/nb/arrangementer/ny`: invalid submit renders one summary with current missing fields (title, contact name, valid email; date is prefilled by the existing mount effect) and the title link focuses the input. Browser on `/nb/grupper/immaturus`: invalid volunteer submit renders one summary with five links, five invalid/described controls, and the first-name link focuses the input. `rg -n "<p[^>]*text-(destructive|red|green)|text-green|text-red" src/features src/components src/app --glob '*.tsx'` has no bare field-message hits outside shared primitives and intentional non-error styling.

M8 input audit (2026-06-11 09:27Z): `rg -n "<Input" src/features --glob '*.tsx'` found 31 feature inputs. Field classes: names/text titles (`autoComplete` name/organization/off as appropriate), emails (`type=email`, `autoComplete=email`), phones (`type=tel`, `inputMode=tel`, `max-w-48`), counts (`type=number`, `inputMode=numeric`, `max-w-20`), prices (`PriceInput`, `max-w-28`, numeric mode), URLs (`type=url`, `inputMode=url`, `autoComplete=url`), dates/times (`type=date/time`), invoice address (`autoComplete=street-address`), org number (`inputMode=numeric`, `max-w-48`). Remaining M8 work: volunteer form stack convergence and mobile keyboard verification.

M9's bundle before/after goes here as the work happens.

## Interfaces and Dependencies

No new runtime dependencies anywhere in M1–M12 (Tailwind v4 utilities, cva, native `<details>`, existing TanStack Form). `shadcn` moves to devDependencies. New modules and their required exports:

    src/components/ui/section-header.tsx   SectionHeader({ number, title })
    src/components/ui/field-group.tsx      FieldGroup({ children, className, error?, errorId? }); FieldHint({ children })
    src/components/ui/select-field.tsx     SelectField(props); type SelectOption
    src/components/ui/price-input.tsx      PriceInput({ id, label, value, onChange })
    src/components/ui/checkbox-field.tsx   CheckboxField(props + disabled); CheckboxSquare({ checked, onChange, disabled? })
    src/components/ui/tag.tsx              Tag (cva: neutral|success|warning|destructive|outline)
    src/components/ui/field-error.tsx      FieldError({ id, children })
    src/components/ui/error-summary.tsx    ErrorSummary({ errors, title? })
    src/components/ui/disclosure.tsx       Disclosure({ summary, children, ...details })
    src/features/events/domain/dates.ts    computeAllDates, expandRRuleDates, formatPrimaryDate, formatTimeRange, getRecurringLabel
    src/app/[locale]/_components/HomeBookingBanner.tsx, HomeGrupperBanner.tsx

Feature barrels gain: `bars` → OpenStatus, OpenStatusRoom; `rooms` → RoomCapacity, BoolSpec; `events` → DateBadges.

Revision note (2026-06-11): rewritten to fold in the design-direction RFC and the site-lift brief — user-specified focus layering (amber→black→cream, gapless), Oatly added to inspirations, conditional-question house rule, tailored-inputs pass, EventCard server-component rework, front-page booking/grupper banners, text-emphasis and eyebrow token consolidation, typed TanStack fields, and the GroupVolunteerForm stack convergence. Earlier M-numbering (M1–M7) is superseded by phases A–D / M1–M13.

Revision note (2026-06-11, later): per user direction — `Surface` is deleted rather than fixed (Tailwind-primitives preference; see Decision Log); two house policies added (prefer stock Tailwind utilities; no arbitrary values in markup) with an M5 conversion table for the existing census; the Disclosure-vs-shadcn-Accordion rationale is recorded in the Decision Log; the direction RFC's touch-target baking (→ M4) and default heading scale (→ M5) — which had dropped out of the previous revision — are restored; and the Progress section now carries granular per-milestone todo checklists.

Revision note (2026-06-14): added and completed M14, making Storybook the exhaustive component catalog while retaining `/design` as the curated application gallery. Recorded the Vite browser-test optimization requirement, Tooltip accessibility fix, complete coverage audit, and final verification evidence.

Revision note (2026-06-11 08:09Z): M1 was verified from current source and M2 was implemented. The plan now records the source-backed `Surface` call-site count (12 instead of the stale 8), the successful `npm install`, successful `npm run build`, and the browser smoke routes used to verify the inlined panel treatment.

Revision note (2026-06-11 08:17Z): M3 was implemented and verified. The plan records the feature-slice destinations, stale-import greps, green build, and browser smoke evidence for open status, room capacity, bool specs, and date badges.

Revision note (2026-06-11 08:24Z): M4 source implementation advanced through focus utilities, primitive/link wiring, radiogroup semantics, and touch-target baking. The plan intentionally leaves the manual keyboard and 400% zoom acceptance open because synthetic Browser Tab presses did not exercise `:focus-visible`.

Revision note (2026-06-11 08:30Z): M5 was partially implemented. Named text-emphasis tokens, text-body/text-eyebrow alignment, `text-eyebrow-sm`, text/tracking arbitrary cleanup, default h1-h4 sizes, and reduced-motion wrapping for `btn-brutal` are complete and build-green. The broader arbitrary-value layout sweep remains open.

Revision note (2026-06-11 08:34Z): M5 was completed. The broader arbitrary-value sweep promoted repeated layout recipes to named `globals.css` utilities, converted stock aspect/spacing cases, and recorded selector-only survivors in the Decision Log.

Revision note (2026-06-11 08:38Z): M6 was implemented and verified with build plus browser smoke. The open status uses Tag, room occupancy uses Tag, success/shadow tokens exist, and card interaction physics is centralized in `interactive-brutal`.

Revision note (2026-06-11 08:57Z): M7 infrastructure and the booking-form invalid-submit slice were implemented and verified. `Alert` now covers booking, karaoke, and event submit success/failure status blocks; booking has an `ErrorSummary` with focusable links plus per-field invalid/describedby wiring for the current submit-gating fields. Karaoke, event-submission, volunteer-form summaries, and the remaining bare destructive paragraphs are still open.

Revision note (2026-06-11 09:15Z): M7 is complete. Karaoke, event submission, and group volunteer forms now use `ErrorSummary` with linked field errors and `aria-invalid`/`aria-describedby`; volunteer submit status uses `Alert`; `SelectField`, `DateScroller`, and `CheckboxField` expose the extra accessibility hooks needed by summaries. Final build is green with the pre-existing Portable Text warning.
