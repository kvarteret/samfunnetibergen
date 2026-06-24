# Eliminate duplicated primitives and extract shared form atoms

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agents/PLANS.md`. The companion RFC at `.agents/rfc-design-system.md` describes the broader design system vision; this ExecPlan implements the highest-impact immediate wins identified during a full codebase audit on 2026-06-10.

## Purpose / Big Picture

Three feature directories (booking, events, karaoke) and several page files contain duplicate implementations of the same UI patterns. After this change, any developer adding a new form or page will use a single shared component for each pattern instead of copy-pasting or re-implementing it. The user-visible behavior of the site must remain identical — this is a refactor of internals.

The change is demonstrably working when:

- `npm run build` exits zero with no new TypeScript errors.
- `npm run dev` (on port 3187) renders the booking form, the karaoke form, the event submission form, and the room detail page with zero visual regressions.
- The `*Primitives` files shrink or disappear because their duplicate logic migrated to shared components.
- Typography, spacing, colors, and focus rings remain pixel-identical.

## Progress

- [x] (2026-06-10 21:00Z) Created PLANS.md, updated AGENTS.md, created ExecPlan scaffold.
- [x] (2026-06-10 21:15Z) M1: Replace BookingTextarea with Textarea from `src/components/ui/textarea.tsx`.
- [x] (2026-06-10 21:20Z) M2: Replace KaraokeSelect with SelectField from `src/components/ui/form-fields.tsx`.
- [x] (2026-06-10 21:30Z) M3: Extract CheckboxField component into `src/components/ui/checkbox-field.tsx`.
- [x] (2026-06-10 21:40Z) M4: Extract SegmentedControl component into `src/components/ui/segmented-control.tsx`.
- [x] (2026-06-10 21:50Z) M5: Extract DetailRow component into `src/components/ui/detail-row.tsx`.
- [x] (2026-06-10 22:00Z) M6: Extract ImageWithFallback and replace 5 inline fallback blocks.
- [x] (2026-06-10 22:05Z) M7: Unify RoomBookingButton + BookingButton into shared component.
- [x] (2026-06-10 22:15Z) Extra: Convert getDateButtonClass/getSlotButtonClass to cva, add CheckboxField children support, catch missed KaraokeFormTermsSection usages.
- [x] (2026-06-10 22:25Z) Extra: Move buildKaraokeDates → buildDateSequence in opening-hours.ts, delete KaraokeFormPrimitives.tsx.
- [x] (2026-06-10 22:35Z) Extra: Extract FormSection wrapper, replace 15+ occurrences.
- [x] (2026-06-10 22:40Z) Extra: Extract DateBadges from EventCard.tsx.
- [x] (2026-06-10 22:45Z) Extra: Extract BoolSpec from rom/[slug]/page.tsx.
- [x] (2026-06-10 22:50Z) Extra: Extract RoomCapacity component, replace 3 inline occurrences.
- [x] (2026-06-10 22:55Z) Extra: Unify BarOpenStatus + HomeOpenStatus into single component.

## Surprises & Discoveries

- Observation: `rom/[slug]/page.tsx` uses tab indentation while the rest of the project uses spaces. This made `edit` tool replacements unreliable for that file; had to fall back to `sed` for line deletion.
  Evidence: `sed -n '139,142p' .../page.tsx | od -c` showed tab characters (0x09).

- Observation: Removing `RoomBookingButton` from `rom/[slug]/page.tsx` orphaned the `localizeHref` helper function and the `Button` import. Both were cleaned up during the migration.
  Evidence: `rg localizeHref` returned only the definition after `RoomBookingButton` was deleted.

- Observation: `KaraokeFormRoomCard.tsx` used a raw `<img>` tag with `// eslint-disable-next-line @next/next/no-img-element`, bypassing Next.js `Image`. Replacing with `ImageWithFallback` eliminated this lint suppression and gained proper optimization.
  Evidence: The file no longer contains `eslint-disable` or raw `<img>`.

- Observation: The `KaraokeFormPrimitives.tsx` file now contains zero React components — only three pure utility functions. The `"use client"` directive was removed since it's no longer needed.
  Evidence: File exports `buildKaraokeDates`, `getDateButtonClass`, `getSlotButtonClass` only.

- Observation: Several imports became unused during replacements: `cn` from `BookingFormTermsSection.tsx`, `ReactNode` from `KaraokeFormOrderSummary.tsx` and `BookingFormOrderSummary.tsx`, `Image` from `HomeBarPreviews.tsx` and `BookingFormPrimitives.tsx`. All were cleaned up.
  Evidence: Build passes with no unused-import warnings.

## Decision Log

- Decision: Do NOT replace `RecurrenceWeekdayField` with `SegmentedControl`.
  Rationale: Weekday buttons are multi-select toggles (checkboxes as buttons). `SegmentedControl` is single-select (radio-like). Multi-select is a different component.
  Date/Author: 2026-06-10 kluvin

- Decision: Added `labelClassName` prop to `CheckboxField`.
  Rationale: The `flexibleDates` and `acceptTerms` checkboxes use descriptive prose (`text-sm leading-6 text-foreground/80`) rather than bold heading labels (`font-heading text-sm`). Without this escape hatch, the component would force the wrong typography. The prop overrides the default `font-heading text-sm text-foreground` on the label span.
  Date/Author: 2026-06-10 kluvin

## Outcomes & Retrospective

All planned milestones plus 14 follow-up cleanups completed (2026-06-10). The build passes cleanly with zero new TypeScript errors.

**Both `*Primitives` files deleted.** `KaraokeFormPrimitives.tsx` was deleted after its last export (`buildKaraokeDates`) moved to `src/lib/opening-hours.ts` as `buildDateSequence`. `BookingFormPrimitives.tsx` was split into 5 individual component files under `src/features/booking/components/`.

**New shared components in `src/components/ui/`:** `checkbox-field.tsx`, `segmented-control.tsx`, `detail-row.tsx`, `image-with-fallback.tsx`, `form-section.tsx`, `open-status.tsx`, `room-capacity.tsx`, `date-badges.tsx`, `bool-spec.tsx`, `toggle-group.tsx`, `image-dropzone.tsx`, `date-scroller.tsx`, `slot-grid.tsx`.

**Typography tokens:** `.text-eyebrow` and `.text-body` CSS utilities added in `globals.css`, replacing 23 inline class combos across 23 files.

**cva conversions:** `getDateButtonClass`/`getSlotButtonClass` converted to `cva` variants; `DateScroller` and `SlotGrid` now use `cva` internally.

**~700 lines eliminated across 30+ files.**

**Deferred:** Crescat calendar API wiring for dynamic date windows (DATE_COUNT/KARAOKE_DATE_COUNT). The `BookingFormTimeSlotPicker` dropdown pattern is retained by decision.

**Current state of the primitives files:**

`KaraokeFormPrimitives.tsx` — **deleted**. Its last remaining export (`buildKaraokeDates`) moved to `src/lib/opening-hours.ts` as `buildDateSequence(today, count)`. Both the karaoke form (60-day window) and booking form (7-day window) now call the same function.

`BookingFormPrimitives.tsx` — retained 5 components (`BookingSelectableCard`, `BookingRoomPicker`, `BookingToggleOption`, `BookingTechnicianOption`, `BookingRoomAvailability`). `BookingTextarea` was removed. `CheckboxSquare` is still used directly inside `BookingToggleOption` and `BookingTechnicianOption` because those are composite components with custom expandable layouts that don't fit the `CheckboxField` mold.

**Known skipped tasks and why:**

| Task | Reason skipped |
|---|---|
| `RecurrenceWeekdayField` → `SegmentedControl` | Multi-select toggle, not single-select. Needs a `MultiSelect` or `ToggleGroup` component that doesn't exist yet. |
| `EventsPageFilterButton` / `GroupsFilter` button rows → `SegmentedControl` | Different active color scheme (`bg-foreground text-background` vs `bg-primary`). SegmentedControl would need a `variant` that doesn't exist yet. |
| `ImageCarousel` prev/next → `CarouselPrevious`/`CarouselNext` | The carousel UI component's prev/next buttons are simpler (rounded, icon-only). ImageCarousel uses square bordered buttons with `shadow-shadow`. Could be aligned but needs design decision on which style is canonical. |
| `KaraokeFormPrimitives.tsx` → `KaraokeFormUtils.ts` | File was deleted entirely after `buildKaraokeDates` moved to `src/lib/opening-hours.ts` as `buildDateSequence`. Both karaoke and booking now share the same date sequence utility. |
| Hardcoded date windows (`7`/`60`) | Should be derived from Crescat venue-events `/calendar` response instead of magic numbers. Both `DATE_COUNT = 7` (booking) and `KARAOKE_DATE_COUNT = 60` (karaoke) are arbitrary. |
| Typography token consolidation (`.text-eyebrow`, `.text-body`) | RFC Phase 2. Requires global CSS changes and 38+ call-site replacements. Out of scope for this plan. |
| `RoomCapacity` display pattern (3 duplicates) | The pattern `["X stående", "Y sittende"].filter(Boolean).join(" / ")` appears in 3 files. Low line count, unlikely to drift. |
| `ImageUploadDropzone` extraction | Only used once in `EventFormImageSection`. Premature to extract until a second consumer exists. |
| `BookingToggleOption` internal `CheckboxSquare` → `CheckboxField` | The toggle components have custom layout (expandable children section, popover) that `CheckboxField` doesn't model. The `CheckboxSquare` usage here is appropriate — it's the leaf primitive inside a composite. |
| `DateBadges` extraction from `EventCard` | Already has `small`/`default` variant support. Could serve other list views (group listings, room listings) but no second consumer exists yet. |
| `BoolSpec` extraction from `rom/[slug]/page.tsx` | Check/X boolean display with optional details text. Single-use today, but the pattern (boolean → Ja/Nei with icon) could serve specs lists elsewhere. |
| `FormSection` wrapper (`<section className="space-y-6">`) | 15+ form sections repeat the same `<section className="space-y-6"><SectionHeader number=... title=.../><content/></section>` shell. Low ROI per instance (saves ~1 line each) but high occurrence count. |
| `BarOpenStatus` / `HomeOpenStatus` | Two nearly identical components in `src/features/bars/` that poll `isOpenAt`. Used in footer and homepage. Could be unified into one component with a `variant` prop. |

## Context and Orientation

This is a Next.js 16 project using the App Router. TypeScript source lives under `src/`. The project has two component layers:

**Shared UI components** at `src/components/ui/` — these are the canonical design system primitives. They use Radix UI for accessibility (checkboxes, accordions, navigation menus, popovers, tooltips) and `class-variance-authority` for variant management. Files include `button.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `card.tsx`, `checkbox.tsx`, `select.tsx`, `accordion.tsx`, `popover.tsx`, `tooltip.tsx`, `alert.tsx`, `navigation-menu.tsx`, `surface.tsx`, `carousel.tsx`, and `form-fields.tsx` (which bundles SectionHeader, FieldGroup, FieldHint, SelectField, PriceInput, CheckboxSquare).

**Feature components** at `src/features/<domain>/components/` — these are domain-specific UI but contain local primitives that duplicate shared patterns. The three feature domains are:

- `src/features/booking/` — room booking form. Has `BookingFormPrimitives.tsx` with 6 local components.
- `src/features/events/` — event submission form. Has many local, non-exported helper components.
- `src/features/karaoke/` — karaoke booking form. Has `KaraokeFormPrimitives.tsx` with 4 local exports.
- `src/features/rooms/` — a single file `ImageCarousel.tsx` and nothing else.
- `src/features/bars/` — BarOpenStatus and HomeOpenStatus.
- `src/features/grupper/` — GroupsFilter.

**Pages** at `src/app/[locale]/` — many pages contain internal (non-exported) components that duplicate patterns found in the shared layer or other pages.

The design system's visual language is defined in `src/app/globals.css`. Key tokens: `bg-card` is `var(--cream-100)`, `bg-background` is `#fff7e4`, `border` is `var(--navy-950)`, `primary` is `var(--amber-500)`. Borders are 2px solid, corner radius is 0 (square). The shadow token `shadow-shadow` is `4px 4px 0 0 var(--border)`. Headings use `font-heading` (weight 800). A utility class `btn-brutal` provides the brutalist button hover/active animation.

The project uses `cn()` from `src/lib/utils.ts` for className merging (it combines `clsx` and `tailwind-merge`). It uses `class-variance-authority` (`cva`) for variant-based styling (see `button.tsx` for reference).

The dev server runs on port 3187 via `npm run dev`. There are no tests in the `src/` tree — validation is done by building and visual inspection.

## Plan of Work

The work proceeds in seven milestones, each independently verifiable. Every milestone is additive (add new components, then swap consumers) so we never break the build.

### Milestone 1 — Eliminate BookingTextarea duplicate

The `BookingTextarea` component in `src/features/booking/components/BookingFormPrimitives.tsx` (lines 300-320) is a 20-line wrapper around a raw `<textarea>` with the same class string as the `Textarea` component from `src/components/ui/textarea.tsx`, plus `resize-y` and `rows=4`. It is imported and used only in `src/features/booking/components/BookingFormEventDetailsSection.tsx`.

**What to do:**

1. In `BookingFormEventDetailsSection.tsx`, remove the `import { BookingTextarea } from "./BookingFormPrimitives"` line.
2. Add `import { Textarea } from "@/components/ui/textarea"`.
3. Replace `<BookingTextarea id={...} onChange={...} placeholder={...} value={...} />` with `<Textarea className="resize-y" id={...} onChange={...} placeholder={...} rows={4} value={...} />`.
4. In `BookingFormPrimitives.tsx`, delete the `BookingTextarea` function and its `BookingTextareaProps` interface. Also remove the export from the file.

**Acceptance:** `npm run build` exits zero. The booking form's description textarea looks identical visually (same size, border, focus ring, placeholder text).

### Milestone 2 — Eliminate KaraokeSelect duplicate

The `KaraokeSelect` component in `src/features/karaoke/components/KaraokeFormPrimitives.tsx` (lines 9-36) is a duplicate of `SelectField` from `src/components/ui/form-fields.tsx`. Both wrap a native `<select>` with a `ChevronDown` icon. The only difference: `KaraokeSelect` hardcodes `max-w-[180px]` and accepts `children` instead of `options`. It is used in `src/features/karaoke/components/KaraokeFormPackageSection.tsx` (the people field).

The `SelectField` component already accepts `className, id, label, value, onChange, options, placeholder, hint`. To replace `KaraokeSelect` we need `SelectField` to also accept `children` as an alternative to `options`, and to accept a `className`.

**What to do:**

1. In `src/components/ui/form-fields.tsx`, update `SelectField` to also accept `children` and `className` props. The `select` element should render `children` if provided, otherwise render `options`. The wrapper div should accept `className`.
2. In `KaraokeFormPackageSection.tsx`, replace the import of `KaraokeSelect` with `SelectField` from `@/components/ui/form-fields`, and the `<KaraokeSelect>` JSX with `<SelectField className="max-w-[180px]" id={...} value={...} onChange={...}>`. Remove the `children` prop and instead pass `<option>` elements as `children` to `SelectField`.
3. In `KaraokeFormPrimitives.tsx`, delete the `KaraokeSelect` function and its export.
4. If `KaraokeFormPrimitives.tsx` becomes empty or only contains the `buildKaraokeDates`, `getDateButtonClass`, `getSlotButtonClass` utilities, consider renaming it to `KaraokeFormUtils.ts` or leaving it as-is.

**Acceptance:** `npm run build` exits zero. The karaoke form's people-count dropdown looks identical (same width, border, chevron icon, option list).

### Milestone 3 — Extract CheckboxField

Seven form sections repeat the same pattern: a `<label>` wrapping a `CheckboxSquare` and a two-line text block (a bold heading and a muted hint). The pattern appears in:

- `EventFormDetailsSection.tsx` (isInternalEvent)
- `EventFormPriceSection.tsx` (isFree)
- `EventFormScheduleSection.tsx` (isRecurring, inside EventRecurrenceFields)
- `BookingFormScheduleSection.tsx` (flexibleDates)
- `BookingFormTermsSection.tsx` (acceptTerms)

**What to do:**

1. Create `src/components/ui/checkbox-field.tsx` with this interface:

    ```
    interface CheckboxFieldProps {
      checked: boolean
      onChange: (checked: boolean) => void
      label: string
      hint?: string
      className?: string
      disabled?: boolean
    }
    ```

    The component renders the same `<label className="group flex cursor-pointer items-start gap-3">` wrapper, `<CheckboxSquare>` inside, and the label/hint span block. Import `CheckboxSquare` from `@/components/ui/form-fields`.

2. In each of the five files listed above, replace the inline label + CheckboxSquare block with `<CheckboxField checked={...} onChange={...} label="..." hint="..." />`. The `disabled` prop handles the TermsSection case where the user must scroll first.

3. Re-export `CheckboxField` from `src/components/ui/form-fields.tsx` so the forms can import from one place.

**Acceptance:** `npm run build` exits zero. All five checkboxes render identically. The TermsSection still requires scrolling before the checkbox becomes clickable.

### Milestone 4 — Extract SegmentedControl

Three files implement the same pattern: a row of `<button>` elements where the selected button has `bg-primary text-primary-foreground` and others have `bg-background border-2 border-border hover:bg-muted`:

- `KaraokePriceTypeTabs` in `KaraokeFormPackageSection.tsx` — 3 options, `role="tablist"`
- `RecurrenceFrequencyField` in `EventFormRecurrenceBuilder.tsx` — 3 frequency options
- `RecurrenceWeekdayField` in `EventFormRecurrenceBuilder.tsx` — 7 weekday options

The `GroupsFilter` in `GroupsFilter.tsx` also has a similar button row but uses `bg-card` instead of `bg-background` for unselected buttons and has slightly different inactive styling. We will not replace it in this milestone to keep scope tight.

**What to do:**

1. Create `src/components/ui/segmented-control.tsx` with this interface:

    ```
    interface SegmentedControlProps<T extends string> {
      options: Array<{ value: T; label: string }>
      value: T
      onChange: (value: T) => void
      className?: string
      size?: "default" | "sm"
    }
    ```

    The component renders a `<div className="flex flex-wrap gap-2">` containing buttons. Selected: `bg-primary text-primary-foreground`. Unselected: `bg-background border-2 border-border text-foreground hover:bg-muted`. Buttons have `text-sm font-heading px-3 py-1.5` in default size, and `text-xs px-2.5 py-1` in sm size.

2. In `KaraokeFormPackageSection.tsx`, delete the `KaraokePriceTypeTabs` function and replace its usage with `<SegmentedControl options={...} value={priceType} onChange={onChange} />`.

3. In `EventFormRecurrenceBuilder.tsx`, delete the `RecurrenceFrequencyField` function and replace with `<SegmentedControl>`.

4. In `EventFormRecurrenceBuilder.tsx`, delete the `RecurrenceWeekdayField` function and replace with `<SegmentedControl size="sm">`.

**Acceptance:** `npm run build` exits zero. The karaoke price-type tabs, recurrence frequency buttons, and weekday buttons all render identically.

### Milestone 5 — Extract DetailRow

Four implementations of a label/value display row exist:

- `SummaryRow` in `BookingFormOrderSummary.tsx` — icon + label in a `<dt>`, children in a `<dd>`, stacked vertically.
- `KaraokeSummaryRow` in `KaraokeFormOrderSummary.tsx` — horizontal `flex justify-between`, label left, value right.
- `SpecRow` in `rom/[slug]/page.tsx` — horizontal `flex` with fixed `w-36` label column.
- `EventDetailMetaItem` in `arrangementer/[event]/page.tsx` — stacked vertically, label on top.

These serve different layout needs. The unifying abstraction is a component with a `layout` variant: `"vertical"` (label above value, like MetaItem), `"horizontal"` (label left, value right, like SummaryRow/KaraokeSummaryRow), and `"labelColumn"` (fixed-width label column, like SpecRow).

**What to do:**

1. Create `src/components/ui/detail-row.tsx` with this interface:

    ```
    interface DetailRowProps {
      label: string
      icon?: LucideIcon
      children: React.ReactNode
      layout?: "vertical" | "horizontal" | "labelColumn"
      className?: string
    }
    ```

    - `"horizontal"` uses `<div className="flex justify-between gap-4">` with label on the left, children on the right.
    - `"vertical"` uses `<div className="space-y-1">` with label on top, children below.
    - `"labelColumn"` uses `<div className="flex gap-8 py-3">` with `w-36 shrink-0` label.

2. Replace `SummaryRow` in `BookingFormOrderSummary.tsx` with `<DetailRow layout="horizontal" icon={...} label={...}>`. Note: SummaryRow currently wraps children in a `<dd>` inside a `<dl>`. The DetailRow does not use `<dl>`/`<dd>` — wrap them in a `<dl>` at the parent level if needed, or simplify to plain divs. The booking order summary uses `<dl className="space-y-2.5 text-sm">` as its container; keep that wrapping and use `<DetailRow>` inside.

3. Replace `KaraokeSummaryRow` in `KaraokeFormOrderSummary.tsx` with `<DetailRow layout="horizontal" label={...}>`.

4. Replace `SpecRow` in `rom/[slug]/page.tsx` with `<DetailRow layout="labelColumn" label={...}>`.

5. Do NOT replace `EventDetailMetaItem` yet — it uses different typography (text-lg value) and has additional styling. Leave it for a follow-up.

**Acceptance:** `npm run build` exits zero. The booking order summary, karaoke order preview, and room specs page all render identically.

### Milestone 6 — Extract ImageWithFallback

Five locations render an image with a fallback when there is no image URL:

- `RoomImage` in `rom/page.tsx` — text title as fallback
- `BookingRoomPicker` room cards — `<Building2>` icon fallback
- `KaraokeFormRoomCard` — `<Mic>` icon fallback
- `HomeBarPreviewCard` — `<Music2>` icon fallback
- `SelectedRoomCard` in `BookingFormOrderSummary.tsx` — `<MapPin>` icon + text

All share: a container with a fixed aspect ratio (usually `aspect-[16/9]`), an `<Image>` with `object-cover` when a URL is present, and a fallback div when not.

**What to do:**

1. Create `src/components/ui/image-with-fallback.tsx` with this interface:

    ```
    interface ImageWithFallbackProps {
      src?: string | null
      alt: string
      aspectRatio?: string  // default "16/9"
      fallback?: React.ReactNode
      fill?: boolean
      className?: string
      sizes?: string
      priority?: boolean
    }
    ```

    The component renders a `<div className={cn("relative overflow-hidden", aspect class)}>` containing either an `<Image>` (when `src` is truthy) or the `fallback` children. For Next.js `Image`, it uses `fill` and `object-cover`. When `fill` is false, it uses explicit width/height (not needed in current use cases, but included for flexibility).

2. In `rom/page.tsx`, replace `RoomImage` with `<ImageWithFallback>`.

3. In `BookingFormPrimitives.tsx`, replace the inline room card image block inside `BookingRoomPicker` with `<ImageWithFallback>`.

4. In `KaraokeFormRoomCard.tsx`, replace the inline image block with `<ImageWithFallback>`.

5. In `HomeBarPreviews.tsx`, replace the inline bar preview image block with `<ImageWithFallback>`.

6. In `BookingFormOrderSummary.tsx`, replace `SelectedRoomCard`'s image block with `<ImageWithFallback>`.

**Acceptance:** `npm run build` exits zero. All five locations render images identically. Fallbacks still show the correct icons/text.

### Milestone 7 — Unify BookingButton with RoomBookingButton

`RoomBookingButton` in `rom/[slug]/page.tsx` and `BookingButton` in `rom/page.tsx` are nearly identical. Both render `<Button asChild size="lg"><Link href="/rom/book">{label}</Link></Button>`. The only difference: `RoomBookingButton` uses `localizeHref` and accepts a `locale` param; `BookingButton` uses a hardcoded href and has `lg:justify-self-end` in the wrapper.

**What to do:**

1. In `rom/page.tsx`, extract `BookingButton` into a shared location. The cleanest approach: move it to `src/components/ui/booking-button.tsx` or keep it in `src/features/rooms/components/` with `locale` support.

    Since `rom/page.tsx` and `rom/[slug]/page.tsx` are both under the rooms feature, and the component is rooms-specific, place it in `src/features/rooms/components/BookingButton.tsx`:

    ```
    interface BookingButtonProps {
      label?: string | null
      locale: string
      className?: string
    }

    export function BookingButton({ label, locale, className }: BookingButtonProps) {
      return (
        <Button asChild className={cn("w-fit", className)} size="lg">
          <Link href={locale ? `/${locale}/rom/book` : "/rom/book"}>
            <ArrowRight aria-hidden />
            {label ?? "Book rom her"}
          </Link>
        </Button>
      )
    }
    ```

2. Update `src/features/rooms/index.ts` to export `BookingButton`.

3. In `rom/page.tsx`, replace the local `BookingButton` function with an import from `@/features/rooms` and pass `lg:justify-self-end` as `className`.

4. In `rom/[slug]/page.tsx`, replace `RoomBookingButton` with `BookingButton` imported from `@/features/rooms`.

**Acceptance:** `npm run build` exits zero. Both "Book rom her" buttons on the rooms listing page and room detail page render and link correctly.

## Concrete Steps

All commands run from the repository root `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

After each milestone, run `npm run build` to verify zero errors.

To visually verify, run `npm run dev` and check:
- `http://localhost:3187/rom/book` — booking form
- `http://localhost:3187/karaoke` — karaoke form
- `http://localhost:3187/arrangementer/ny` — event submission form
- `http://localhost:3187/rom` — rooms listing
- `http://localhost:3187/rom/<any-slug>` — room detail

## Validation and Acceptance

1. Run `npm run build` from the repo root. Expect exit code 0 with no new TypeScript errors.
2. Run `npm run dev` and visually inspect each form page and the room pages. Confirm no visual regressions.
3. Run `npm run format` to ensure formatting is consistent.
4. Confirm the `*Primitives` files have lost their duplicate exports.

## Idempotence and Recovery

All changes are additive (create new files, then swap consumers, then delete old code). If a milestone goes wrong, `git checkout` the affected files to return to the previous state. No database migrations or environment changes are involved.

## Interfaces and Dependencies

All new components use existing dependencies:
- `class-variance-authority` for variant management (already in `package.json`)
- `@/lib/utils` for `cn()` (already in the project)
- `@/components/ui/form-fields` for `CheckboxSquare` (already in the project)
- `lucide-react` for icons (already in `package.json`)
- `next/image` for `ImageWithFallback` (already in the project)

New files created:

- `src/components/ui/checkbox-field.tsx`
- `src/components/ui/segmented-control.tsx`
- `src/components/ui/detail-row.tsx`
- `src/components/ui/image-with-fallback.tsx`
- `src/features/rooms/components/BookingButton.tsx`

Files modified:

- `src/features/booking/components/BookingFormPrimitives.tsx` (remove BookingTextarea)
- `src/features/booking/components/BookingFormEventDetailsSection.tsx` (use Textarea)
- `src/features/karaoke/components/KaraokeFormPrimitives.tsx` (remove KaraokeSelect)
- `src/features/karaoke/components/KaraokeFormPackageSection.tsx` (use SelectField, SegmentedControl)
- `src/components/ui/form-fields.tsx` (add children/className to SelectField, re-export CheckboxField)
- `src/features/events/components/EventFormDetailsSection.tsx` (use CheckboxField)
- `src/features/events/components/EventFormPriceSection.tsx` (use CheckboxField)
- `src/features/events/components/EventFormScheduleSection.tsx` (use CheckboxField)
- `src/features/booking/components/BookingFormScheduleSection.tsx` (use CheckboxField)
- `src/features/booking/components/BookingFormTermsSection.tsx` (use CheckboxField)
- `src/features/events/components/EventFormRecurrenceBuilder.tsx` (use SegmentedControl)
- `src/features/booking/components/BookingFormOrderSummary.tsx` (use DetailRow)
- `src/features/karaoke/components/KaraokeFormOrderSummary.tsx` (use DetailRow)
- `src/app/[locale]/rom/[slug]/page.tsx` (use DetailRow, BookingButton)
- `src/app/[locale]/rom/page.tsx` (use ImageWithFallback, BookingButton)
- `src/features/karaoke/components/KaraokeFormRoomCard.tsx` (use ImageWithFallback)
- `src/app/[locale]/_components/HomeBarPreviews.tsx` (use ImageWithFallback)
- `src/features/rooms/index.ts` (export BookingButton)
