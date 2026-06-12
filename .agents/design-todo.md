# Design pass — todo

Direction: **paper / academic** (Bergen student culture house). Flat cards, intentional
rules (no redundant dividers), lean on Tailwind-native utilities over bespoke CSS.

## Done
- [x] Home hero: enlarge title, ground with rule, secondary CTA, live "er åpent!!" pulse.
- [x] Revert `interactive-brutal` on home bar cards (back to flat `panel`).
- [x] Group detail (e-tjenesten): dossier masthead (classification tag + logo chip, big
      title, serif lead), single rule, sidebar as labeled "index cards", serif caption.
- [x] `SectionHeader` / `FormSection`: `number` now optional; dropped placeholder
      `number="00"` from the volunteer form.

## Next (focused)
- [ ] Ofte stilte spørsmål / `/nb/sporsmal-booking` — redesign pure-text page (paper/academic, image-aware).

## Base UI component audit

### Replace first
- [x] Form field foundation: compose `FieldGroup`, labels, hints, errors, `Input`, and
      `Textarea` from Base UI `Field` primitives while keeping TanStack Form as the
      state and validation engine. This is the largest reuse opportunity (21 field-group
      consumers. `Textarea` remains the native control inside the Base UI field
      composition because Base UI 1.5 does not expose a textarea primitive.
- [x] Checkbox foundation: replace the hand-built hidden checkbox and visual indicator
      in `CheckboxField` with Base UI `Checkbox`; use `CheckboxGroup` for repeated
      multi-select answers.
- [x] Select foundation: replace `SelectField` with a shadcn-style Base UI `Select`
      wrapper. Use `Combobox` instead where organizer, place, or group option sets are
      large enough to require filtering. The event organizer group field now uses the
      filterable combobox.
- [x] Numeric fields: replace `PriceInput` and raw numeric booking/recurrence inputs
      with a Base UI `NumberField` wrapper for consistent parsing, min/max, stepping,
      keyboard controls, and optional increment/decrement buttons.
- [x] Disclosure collections: use Base UI `Accordion` for FAQ/filter collections and
      `Collapsible` for a single independent disclosure.

### Use where the semantics fit
- [x] Avatar: add a Base UI `Avatar` wrapper for people and group identity marks where
      an image needs initials/icon fallback. Keep Next `Image` for event, room, hero,
      and other content photography.
- [x] Preview card: evaluated. There is no current compact text link with enough
      preview data and a clear interaction need, so no unused wrapper was added.
      Reconsider only for a concrete hover/focus preview of an event, room, or group.
      It is not a replacement for persistent cards.
- [x] Tooltip: added for the icon-only event-date removal control after preserving its
      accessible name. Required instructions remain visible.
- [x] Toast: evaluated. Current form success confirmations replace the form and must
      remain persistent; cross-field errors remain in `ErrorSummary`. Add Toast only
      for a concrete transient save or submission notification.
- [x] Popover: evaluated. No current help control requires anchored interactive
      content, so no unused wrapper was added. Reconsider for recurrence or
      availability help when that interaction exists.

### Keep custom
- [ ] Keep `Card` and domain cards as application layout components; Base UI does not
      provide a static card primitive.
- [ ] Keep the Embla carousel, Next image fallback, and image dropzone; Base UI does
      not replace their media, optimization, or file-input responsibilities.
- [ ] Keep `SegmentedControl`, `SelectableCard`, `DateScroller`, and `SlotGrid` as
      distinct application APIs over the shared Base UI radio foundation.
- [ ] Keep `ToggleGroup` separate because it represents zero-or-more pressed controls,
      not exactly-one form selection.
- [ ] Do not use Tabs for booking answers such as “Hvem booker”; Tabs switch views,
      while those answers are submitted radio values.

## Backlog (foundational, confirm before sweeping)
- [ ] globals.css review: collapse unused color ramps; reconsider `font-heading`/`font-base`
      vs Tailwind weights (task #1); convert bespoke utilities `grid-auto-side`,
      `grid-two-one`, `text-body` → Tailwind (task #2). Wide blast radius — confirm first.
- [ ] Remove remaining redundant lines on the front page.
- [ ] Other main pages: events, booking, kontakt, grupper list, forms.

## Notes
- Group images are coming; the front-page "Bli frivillig" hero will reuse them.
