# RFC: Design system direction and improvement suggestions

## Status

Suggestions — nothing here is implemented. Approved items should graduate into
an ExecPlan (`.agents/execplans/`), most naturally as milestones alongside or
after `002-design-system-hardening.md` (which fixes structural debt; this RFC
proposes design improvements on top).

## Named direction

The system's inspirations, made explicit so future work can be judged against
them:

- **NHS design system / GOV.UK heritage** — service-design pragmatism. Forms
  are the product, not decoration: strong field anatomy (label → hint → error →
  input), error summaries that users can act on, unmissable focus states,
  44px minimum touch targets, content-first pages that work for stressed
  people on bad phones. We borrow the *rigor*, not the look.
- **Neobrutalism** — the current visual language: square corners
  (`--radius: 0rem`), 2px navy borders, hard offset shadows
  (`4px 4px 0 0`), flat amber/cream/navy fills, chunky weight-800 headings,
  press-in button physics (`btn-brutal`). The `ui/` layer's conventions
  (`font-base`/`font-heading` weights, `--main`, `rounded-base`) follow
  neobrutalism-style shadcn theming.
- **Brutalism (web)** — honesty of material: native elements where they
  suffice (`<details>`, `<select>`), visible structure, no decorative
  abstraction. The groups FAQ already uses a raw `<details>`; that instinct is
  right and should become a primitive.

The combined test for any new component: *would it look at home in an NHS
service built by someone who loves hard shadows?* Sturdy, legible, a bit loud,
never fragile.

## Suggestions

Ordered by value. Each names the evidence in the current code and the concrete
change.

### 1. An unmissable, systematized focus state (NHS's signature move)

Today: `focus-visible:ring-2 ring-ring` (a 2px amber ring) on Button/Input —
and *nothing* on seven interactive primitives (`checkbox-field`,
`segmented-control`, `toggle-group`, `toggle-option`, `date-scroller`,
`slot-grid`, `image-dropzone`). A thin amber ring on a cream background is
also low-contrast — the opposite of the brand's loudness.

Suggestion: define a single `focus-brutal` utility in `globals.css` in the
spirit of GOV.UK's famous yellow focus, translated to our palette: e.g.
`outline: 3px solid var(--foreground); outline-offset: 2px; background:
var(--gold-300)` on focusable text targets, or for boxy controls a solid
`box-shadow: 0 0 0 3px var(--foreground)` ring. One token, applied to every
interactive primitive, documented as non-negotiable. This subsumes ExecPlan
002 M2's focus work — same effort, but the result is a designed state instead
of a default ring.

### 2. NHS-pattern form errors: `FieldError` + `ErrorSummary`

Today: errors render as bare `<p className="text-sm text-destructive">` with
no `aria-describedby`, no `aria-invalid`, no link between message and input
(see `GroupVolunteerForm.tsx:196`), and nothing tells a screen-reader user the
submit failed except focus staying put. The Alert primitive that could host
this is dead code (zero importers).

Suggestion: adopt the NHS form-error anatomy across all four forms (booking,
karaoke, event submission, volunteer):

- `FieldError` primitive: bold red message rendered between hint and input,
  `id`-linked via `aria-describedby`, sets `aria-invalid` on the control, and
  a 4px red left border on the errored field group (NHS's error highlight —
  very much at home in a brutalist system).
- `ErrorSummary` primitive: a bordered box (red 2px border, hard shadow)
  inserted at the top of the form on failed submit, listing each error as an
  anchor that focuses the offending field; the box itself receives focus on
  render. This is the single highest-impact accessibility pattern NHS ships.
- Resurrect `alert.tsx` (instead of deleting it in 002 M3) restyled as the
  brutalist callout for submit success/failure, with `role="status"` /
  `role="alert"` as appropriate.

### 3. A success color — the palette cannot say "yes"

Today: the palette is amber/gold/red/navy/cream. There is no green.
`OpenStatus` colors "open now" with `text-primary` (amber) — the same color
as every CTA, so "open" reads as "button". Form success states have no
semantic color to use at all.

Suggestion: add a green scale (same oklch ramp structure as the others, hue
~150) plus `--success` / `--success-foreground` semantic tokens, mapped in
`@theme inline`. Use it in `OpenStatus` (open = success green, closed =
muted), in the post-submit confirmation surfaces, and in suggestion 4's Tag.
NHS treats status color as load-bearing semantics; right now we only have
"warning-colored everything".

### 4. A `Tag`/`Badge` primitive for statuses

Today: status-ish chips are hand-rolled per site area (event date badges,
"open now" text, filter pills). NHS's Tag is one of its most-used components
because operational sites constantly label state (booked, free, open, closed,
cancelled, internal).

Suggestion: `src/components/ui/tag.tsx` — uppercase `text-eyebrow`-style
label in a 2px-bordered box, `cva` variants `neutral | success | warning |
destructive | primary`. Immediate consumers: OpenStatus, event cards
(cancelled/internal markers), room availability.

### 5. One `Disclosure` primitive on native `<details>` (answers the accordion question)

Today: the groups FAQ hand-rolls `<details>`/`<summary>` with brutalist
classes inline (`grupper/page.tsx:114`); the Radix `accordion.tsx` sits unused;
`.agents/design-system.md` still lists an `ExpandableText` component that no
longer exists in the codebase. Three names, one concept: a disclosure.

Suggestion: `src/components/ui/disclosure.tsx` built on native
`<details>`/`<summary>` — NHS's "Expander" is exactly this element, and it is
the most brutalist-honest implementation possible (works without JS, free
keyboard support, free semantics). Brutalist treatment: 2px border, hard
shadow, a `+`/`−` or chevron marker that rotates via the `details[open]`
selector. Replace the groups FAQ markup with it; delete the dead Radix
accordion (already planned in 002 M3); purge the stale `ExpandableText` doc
entry (002 M6). Stacked `Disclosure`s *are* the accordion — no separate
component needed unless exclusive-open behavior is ever required.

### 6. Systematize interaction depth: shadow scale + `interactive-brutal`

Today: `btn-brutal` owns the signature hover-lift/press-in physics, but it is
button-only. `SelectableCard`, `ToggleOption`, event cards, and carousel
buttons each either hand-roll a partial version or have no pressed state. There
is exactly one shadow token (4px), so depth cannot express hierarchy. And there
is zero `prefers-reduced-motion` handling anywhere in `globals.css`.

Suggestion:

- Shadow scale: `--shadow-sm: 2px 2px`, `--shadow: 4px 4px` (existing),
  `--shadow-lg: 6px 6px` — small for chips/tags, default for cards/buttons,
  large for modals/popovers and hover-lift targets.
- An `interactive-brutal` utility generalizing `btn-brutal`'s
  translate/shadow choreography so selectable cards and toggles share the same
  physical language as buttons.
- Wrap all transform/shadow transitions in
  `@media (prefers-reduced-motion: no-preference)` — one-line fix per
  utility, mandatory for the NHS-grade accessibility bar we are claiming.

### 7. Codify field anatomy and bake in touch targets

Today: `SelectField` renders label → hint → input (correct NHS order) but the
anatomy is convention, not contract; other fields assemble label/hint/error ad
hoc. Touch-target sizing was recently fixed *at call sites* (commit
`3db2691`), which means it can silently regress.

Suggestion: document the field anatomy (label → hint → error → control) in
`.agents/design-system.md` as a rule, extend `FieldGroup` to slot `FieldError`
from suggestion 2, and move `min-h-11` (44px) into the primitives themselves —
`SegmentedControl`, `DateScroller`, `SlotGrid`, `ToggleGroup` buttons — so no
call site can produce a sub-44px target again.

### 8. Default heading scale (smallest suggestion)

Today: `@layer base` sets `font-heading` weight on `h1–h6` but no sizes, so
every page re-picks `text-4xl`/`text-xl` by hand and drift is already visible
between pages. Suggest defining default responsive sizes for `h1–h4` in
`@layer base` (pages can still override), giving the type system the same
"defined once" property the color tokens have.

## What this deliberately does not propose

No dark mode (the cream/navy identity is the brand; NHS ships light-only too).
No rounded-corner softening. No additional fonts. No animation beyond the
existing translate/shadow physics. No component library swap — suggestions 1–8
are all achievable with the existing stack (Tailwind v4 utilities, cva, native
elements).

## Suggested sequencing

1, 2, 3 are the high-value core (focus, errors, success semantics) and
naturally merge with or follow ExecPlan 002's M2/M3. 4 and 5 are small
self-contained primitives. 6 and 7 are systematization passes. 8 is a
one-file change. If approved, fold 1 into 002 M2 (amend that milestone), keep
the rest as a new ExecPlan `003-design-system-direction.md` with the gallery
page (002 M5) extended to showcase each new state and primitive.
