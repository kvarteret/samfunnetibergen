# Migrate form and disclosure foundations to Base UI

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries,
Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds.
This document is maintained in accordance with `.agents/PLANS.md`.

## Purpose / Big Picture

The site currently uses Base UI for navigation and selection controls, but most form
fields still recreate labeling, validation, checkbox, select, number, and disclosure
behavior. After this migration, those shared behaviors come from Base UI while
TanStack Form remains responsible for form values and application validation.

A user should be able to complete booking, event, karaoke, and volunteer forms with
consistent keyboard behavior, focus handling, labels, descriptions, errors, popup
selects, and numeric controls. FAQ collections should support expected accordion
keyboard navigation. Identity images may use resilient avatar fallbacks without
turning content photography into avatars.

## Progress

- [x] (2026-06-12 09:00Z) Inventoried the shared form wrappers and their consumers.
- [x] (2026-06-12 09:05Z) Verified the installed Base UI Field, Checkbox, Select,
      Number Field, Accordion, Avatar, Preview Card, Tooltip, Toast, and Popover APIs.
- [x] (2026-06-12 09:40Z) Migrated Field, Input, Label, Description, and Error
      composition; retained native textarea controls inside Base UI Field roots.
- [x] (2026-06-12 10:00Z) Migrated checkbox behavior and added a CheckboxGroup
      foundation with a controlled design-system example.
- [x] (2026-06-12 10:20Z) Migrated selects and numeric controls; used Combobox for the
      event organizer group list.
- [x] (2026-06-12 10:35Z) Migrated FAQ collections to Accordion and independent
      disclosures to Collapsible.
- [x] (2026-06-12 10:45Z) Added Avatar for contact people and group identity marks.
- [x] (2026-06-12 10:55Z) Added Tooltip for an icon-only date removal action and
      evaluated Preview Card, Toast, and Popover against current uses.
- [x] (2026-06-12 11:15Z) Ran source, type, production-build, and focused browser
      verification.
- [x] (2026-06-12 11:20Z) Reviewed the completed migration and updated the
      design-system task list.

## Surprises & Discoveries

- Observation: `FieldHint` is used both as a real field description and as free-standing
  status copy.
  Evidence: `BookingFormTimeSlotPicker.tsx` returns `FieldHint` when no date is selected,
  while most other consumers place it inside `FieldGroup`.

- Observation: `Label` has at least one use outside `FieldGroup`.
  Evidence: The microphone quantity label in `BookingFormNeedsSection.tsx` is nested
  inside `ToggleOption`, so it must gain a field root before `Label` can become
  Base UI `Field.Label`.

- Observation: Existing selects accept native `<option>` children.
  Evidence: Volunteer institution, karaoke duration, and karaoke people selects build
  options as children. The Base UI wrapper must normalize these consumers to structured
  option data rather than parse React children.

- Observation: Base UI 1.5 exposes an input-oriented Field Control but no textarea
  primitive with textarea-compatible ref and event types.
  Evidence: Composing `Field.Control` with a textarea produced incompatible input and
  textarea TypeScript types.

- Observation: The volunteer form rendered some validation errors twice.
  Evidence: Several fields supplied `error` to `FieldGroup` and also rendered the same
  error through a nested `FieldError`.

- Observation: The event organizer group list is the current select collection that
  benefits from filtering.
  Evidence: The field consumes the full organizer group dataset and was successfully
  verified by filtering for and selecting “Quiz-gruppen”.

## Decision Log

- Decision: Keep TanStack Form as the state and validation engine.
  Rationale: Base UI Field accepts externally controlled `invalid`, `dirty`, and
  `touched` state and provides accessible composition without replacing application
  form state.
  Date/Author: 2026-06-12 / Codex

- Decision: Correct free-standing Label, Description, and Error uses instead of making
  Base UI context-dependent components silently fall back to unrelated HTML.
  Rationale: One component should have one semantic contract. Status copy is not a
  field description, and an error not associated with a field should be an alert or
  status message.
  Date/Author: 2026-06-12 / Codex

- Decision: Preserve application-level wrappers around Base UI primitives.
  Rationale: The wrappers own the site's visual language and provide stable,
  intentionally narrow APIs while Base UI owns interaction and accessibility behavior.
  Date/Author: 2026-06-12 / Codex

- Decision: Keep the native textarea element inside the Base UI Field composition.
  Rationale: Forcing the input-oriented Field Control onto textarea creates incorrect
  TypeScript contracts. Field Root, Label, Description, and Error still provide the
  shared accessible field relationship.
  Date/Author: 2026-06-12 / Codex

- Decision: Use Combobox for the event organizer group field and keep smaller,
  predictable option sets on Select.
  Rationale: Filtering is useful for the organizer dataset but would add unnecessary
  interaction complexity to short duration, people-count, and institution lists.
  Date/Author: 2026-06-12 / Codex

- Decision: Do not add Preview Card, Toast, or Popover wrappers without a current
  semantic use.
  Rationale: Existing cards are persistent content, current form confirmations must
  remain visible, and no present help content needs an anchored interactive surface.
  Adding wrappers now would create unused design-system API.
  Date/Author: 2026-06-12 / Codex

## Outcomes & Retrospective

The shared form layer now delegates field relationships, checkboxes, selects,
combobox filtering, numeric input behavior, disclosures, avatars, and the justified
tooltip interaction to Base UI. TanStack Form continues to own values and validation.

All raw numeric inputs and native details/summary disclosures in application TSX were
removed. The booking, event, karaoke, and volunteer forms retain their existing domain
value shapes through conversion at wrapper boundaries.

TypeScript, targeted Biome checks, `git diff --check`, and the production build pass.
Focused browser checks covered the design select and disclosure, checkbox and numeric
form controls, organizer combobox filtering, recurrence controls, FAQ accordion, and
avatar fallback routes. The production build still reports the pre-existing Portable
Text warning for an unknown `undefined` block type.

## Context and Orientation

Shared form primitives live in `src/components/ui/`. `field-group.tsx`,
`field-error.tsx`, `label.tsx`, `input.tsx`, and `textarea.tsx` form the current field
composition. `checkbox-field.tsx`, `select-field.tsx`, and `price-input.tsx` implement
specialized controls. Booking, event submission, karaoke, and volunteer forms consume
these wrappers while TanStack Form controls their values.

Base UI Field is a context that connects a label, description, error, and compatible
control. A Base UI control nested inside a Field Root receives the associated accessible
relationships. Base UI Select and Number Field are controlled primitives whose value
callbacks can be connected directly to TanStack Form field handlers.

## Plan of Work

First, replace the field composition wrappers with Base UI primitives and repair the
small number of consumers that currently use field-only parts outside a field root.
Use the Base UI Input primitive for text inputs and compose textarea through Field
Control when necessary.

Second, replace the custom hidden checkbox with Base UI Checkbox and expose a
CheckboxGroup wrapper for actual repeated multi-select answers. Replace native selects
with a shadcn-style Base UI Select wrapper using structured options. Use Combobox only
after option counts demonstrate that filtering is needed; do not introduce a second
control merely because it exists.

Third, add a reusable NumberField and migrate price, audience count, microphone
quantity, and recurrence numeric inputs. Preserve string values where the domain form
currently stores strings, converting only at the wrapper boundary.

Fourth, implement Base UI Collapsible for one independent Disclosure and Base UI
Accordion for FAQ collections. Keep content and styling application-owned.

Finally, add Avatar for current people or group identity marks. Evaluate Preview Card,
Tooltip, Toast, and Popover only against present interaction requirements. Record
rejected uses when adding a primitive would create unused abstraction.

## Concrete Steps

Run commands from `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

After each foundation milestone:

    npx biome check <changed files>
    npx tsc --noEmit

After all migrations:

    npm run build
    git diff --check

Use the existing development server at `http://localhost:3187` when available. Verify
the design-system controls and one representative form for keyboard selection, visible
errors, popup selects, numeric input, checkbox state, and accordion behavior.

## Validation and Acceptance

Labels, descriptions, and errors must remain programmatically associated with their
controls. Controlled values must update TanStack Form without render loops. Select
popups must support keyboard navigation and return the same domain values as before.
Number fields must preserve allowed empty states and min/max behavior. Checkboxes must
retain disabled, invalid, described-by, and controlled checked behavior.

FAQ collections must support arrow-key focus between triggers and allow the intended
single or multiple open policy. Independent disclosures must open and close without
affecting siblings.

TypeScript, targeted Biome checks, `git diff --check`, and the production build must
pass. Existing unrelated warnings should be reported rather than hidden.

## Idempotence and Recovery

All edits are source-only and safe to retry. The worktree contains unrelated user
changes; do not reset or revert them. Keep each migration centered on a shared wrapper
and its direct consumers so failures can be diagnosed without broad rollback.

## Artifacts and Notes

Base UI Field Root has an `invalid` prop intended for external form libraries. Field
Error accepts `match={true}` so TanStack Form can control whether an application error
is rendered. Base UI Select recommends Combobox only when lists are large enough to
need filtering.

## Interfaces and Dependencies

The repository continues to depend on `@base-ui/react`. Shared wrappers import
individual entry points such as `@base-ui/react/field`, `@base-ui/react/checkbox`,
`@base-ui/react/select`, `@base-ui/react/number-field`,
`@base-ui/react/accordion`, and `@base-ui/react/avatar`.

`FieldGroup` remains the externally controlled field root. `SelectField` accepts
structured options. `NumberField` accepts a numeric value or `null` and reports the
same. Domain wrappers such as `PriceInput` may translate between numeric and string
storage where required.

Revision note: Created on 2026-06-12 after source and installed-library inspection to
define the staged migration and its semantic boundaries. Updated after implementation
to record completed verification and rejected primitive uses.
