# RFC: Samfunnet i Bergen Design System

**Status:** Draft  
**Author:** kluvin  
**Date:** 2026-06-09

## Problem

The codebase has no shared design system — UI patterns are copy-pasted with raw
Tailwind classes across 65+ component files. Form-field molecules live inside
the events feature but are imported by booking and karaoke. "Surface" panels,
alerts, typography, and layout grids are redefined ad-hoc everywhere. This
creates inconsistency, makes sweeping design changes expensive, and violates
feature-boundary hygiene (events does not own the concept of a select dropdown).

### Quantitative baseline

| Pattern | Occurrences | Current location |
|---------|------------|------------------|
| `border-2 border-border bg-card p-*` (Surface) | 25 | Ad-hoc in pages, features, components |
| `font-heading text-xs uppercase tracking-[0.18em]` (eyebrow) | 16 | Ad-hoc everywhere |
| `text-sm leading-6 text-foreground/75` (body prose) | 22 | Ad-hoc everywhere |
| `font-heading` (heading token) | 157 | Consistent token, but sizes vary ad-hoc |
| Custom `<select>` styling (raw CSS) | 3 | FormFields.tsx + 2 karaoke duplicates |
| `border-t-2 border-border pt-8` (section divider) | 5 | 3 forms + blifrivillig |
| Error alert box (`destructive/10`) | 3 | karaoke + booking + events |
| Success box (`primary/5`) | 3 | karaoke + booking |
| `min-w-0 space-y-14` (form shell) | 3 | All 3 form components |
| Grid content+sidebar | 7 | Pages with varying column ratios |

### Cross-feature imports (the smoking gun)

```
src/features/booking/components/FormSections.tsx
  → import { SectionHeader, FieldGroup, FieldHint, CheckboxSquare, SelectField }
    from "@/features/events/components/FormFields"   ← wrong ownership

src/features/karaoke/components/KaraokeBookingForm.tsx
  → import { SectionHeader, FieldGroup, FieldHint, CheckboxSquare }
    from "@/features/events/components/FormFields"   ← wrong ownership

src/features/booking/components/TimeSlotPicker.tsx
  → import { FieldHint, SelectField }
    from "@/features/events/components/FormFields"   ← wrong ownership
```

Form-field molecules conceptually belong to the **design system**, not the
events feature. Events is just one consumer among three.

---

## Proposed Direction

### Phase 1 — Extract atoms (`src/components/ui/`)

Move form-field primitives from `src/features/events/components/FormFields.tsx`
into `src/components/ui/` as composable atoms. Each gets its own file.

```
src/components/ui/
├── surface.tsx         ← NEW: canonical bordered panel
├── section-header.tsx  ← MOVE: from events/FormFields
├── field-group.tsx     ← MOVE: from events/FormFields
├── field-hint.tsx      ← MOVE: from events/FormFields
├── checkbox-square.tsx ← MOVE: from events/FormFields
├── select-field.tsx    ← MOVE: from events/FormFields
├── price-input.tsx     ← MOVE: from events/FormFields
├── divider.tsx         ← NEW: section divider
├── form-layout.tsx     ← NEW: form shell wrapper
├── content-sidebar.tsx ← NEW: content+sidebar grid
├── button.tsx          ← existing (shadcn)
├── input.tsx           ← existing (shadcn)
├── label.tsx           ← existing (shadcn)
├── card.tsx            ← existing (shadcn, may need bg-card variant)
├── alert.tsx           ← existing (shadcn, needs destructive/success variants)
└── ...
```

### Phase 2 — Typography tokens (`src/styles/` or Tailwind config)

Add semantic Tailwind utility classes (via `@layer utilities`) for repeated
typography patterns so they become single-class tokens instead of 4-class combos:

| Token | Tailwind classes | Usage |
|-------|-----------------|-------|
| `.text-eyebrow` | `font-heading text-xs uppercase tracking-[0.18em] text-foreground/60` | Section labels, meta info |
| `.text-body` | `text-sm leading-6 text-foreground/75` | Prose paragraphs |
| `.text-body-lg` | `text-lg leading-7 text-foreground/80` | Introduction paragraphs |

These live in `src/styles/typography.css` imported in `globals.css`.

### Phase 3 — Adopt Surface everywhere

Replace all 25 occurrences of `border-2 border-border bg-card p-*` with
`<Surface p={5} as="section">`. Benefits:

- Single source of truth for border width, color, background
- `as` prop enables semantic HTML (`<aside>`, `<section>`, `<article>`)
- Padding becomes a prop (`p={4}`, `p={5}`, `p={6}`)
- If we later soften the border or add shadow, it's one change

### Phase 4 — Alert/notice primitives

Two recurring status boxes need a shared component:

```tsx
// Error: border-2 border-destructive bg-destructive/10 px-4 py-3 flex items-start gap-3
// Success: border-2 border-primary bg-primary/5 p-8 space-y-4
// Info: border-2 border-border bg-card p-5 space-y-4

<Alert variant="destructive" icon={X}>Det oppstod en feil</Alert>
<Alert variant="success">Forespørsel mottatt!</Alert>
<Notice>Generell informasjonsboks</Notice>
```

### Phase 5 — Form layout wrapper

All three forms use the same shell:

```tsx
<form className="min-w-0 space-y-14" noValidate onSubmit={...}>
```

A `<FormLayout>` wrapper would enforce consistent spacing:

```tsx
<FormLayout onSubmit={form.handleSubmit}>
  <EventDetailsFields ... />
  <EventImageField ... />
</FormLayout>
```

---

## Component catalog

### `Surface` (replaces 25 ad-hoc divs)

```tsx
interface SurfaceProps {
  as?: "div" | "section" | "aside" | "article"
  p?: 3 | 4 | 5 | 6  // padding, default 5
  className?: string
  children: ReactNode
}

// <div className="border-2 border-border bg-card p-5">
// becomes:
// <Surface p={5} as="aside">
```

### `SectionHeader` (move from events, used by 3 features)

```tsx
interface SectionHeaderProps {
  number: string       // "01", "02", etc.
  title: string
}

// <SectionHeader number="01" title="Om arrangementet" />
```

### `FieldGroup` (move from events)

```tsx
interface FieldGroupProps {
  children: ReactNode
  className?: string
}
// Vertical stack with space-y-2
```

### `FieldHint` (move from events)

```tsx
interface FieldHintProps {
  children: ReactNode
}
// text-xs text-foreground/55
```

### `CheckboxSquare` (move from events)

```tsx
interface CheckboxSquareProps {
  checked: boolean
  onChange: (checked: boolean) => void
}
// Custom checkbox with border-2, Check icon
```

### `SelectField` (move from events)

```tsx
interface SelectFieldProps {
  id: string
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
}
// Styled select with ChevronDown icon wrapper
```

### `PriceInput` (move from events, events-only)

```tsx
interface PriceInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}
// Number input with "kr" prefix
```

### `Divider` (new — 5 ad-hoc occurrences)

```tsx
interface DividerProps {
  className?: string
}
// <hr className="border-t-2 border-border" /> (or section wrapper)
```

### `FormLayout` (new — 3 identical form shells)

```tsx
interface FormLayoutProps {
  onSubmit: (e: FormEvent) => void
  children: ReactNode
  className?: string
}
// <form className="min-w-0 space-y-14" noValidate {...}>
```

### `ContentWithSidebar` (new — 7 grid layouts)

```tsx
interface ContentWithSidebarProps {
  sidebar: ReactNode
  children: ReactNode
  sidebarWidth?: string  // default "minmax(0,1fr)"
  className?: string
}
// <div className="grid gap-12 items-start lg:grid-cols-[minmax(0,2fr)_sidebarWidth]">
```

### `Alert` / `Notice` (new — 6 ad-hoc boxes)

```tsx
interface AlertProps {
  variant: "destructive" | "success" | "info"
  title?: string
  children: ReactNode
  icon?: LucideIcon  // default based on variant
}
```

### Typography tokens (CSS utilities)

```css
@layer utilities {
  .text-eyebrow { @apply font-heading text-xs uppercase tracking-[0.18em] text-foreground/60; }
  .text-body    { @apply text-sm leading-6 text-foreground/75; }
  .text-body-lg { @apply text-lg leading-7 text-foreground/80; }
}
```

---

## What stays as-is (not worth extracting)

| Thing | Why keep |
|-------|----------|
| `font-heading` | Already a token. 157 uses, sizes vary by context — no single component fits. |
| `shadcn Button` | Already an atom. Covers all button variants. |
| `shadcn Input` | Already an atom. Used everywhere. |
| `shadcn Label` | Already an atom. |
| `shadcn Card` (composite) | Used in a few places for structured cards. Not the same as Surface. |
| `EventsFilters`, `FilterButton` | Feature-specific, not shared. |
| `RecurrenceBuilder` | Feature-specific (events only). |
| `TimeSlotPicker` | Booking-specific. |
| `ImageCarousel` | Rooms-specific. |
| Navbar, Footer, MobileMenu | Only instantiated once in root layout — no duplication. |
| `ExpandableText` | Home-page only. Simple enough to stay inline. |
| `BarOpenStatus` | Used in footer and home — 2 places. Could be moved to `components/` but low priority. |
| `shadow-shadow` | Good as a CSS utility token. Already centralized. |

---

## Migration phases

| Phase | Scope | Risk | Effort |
|-------|-------|------|--------|
| 1 | Move FormFields.tsx → `src/components/ui/form-fields/*.tsx` | Low — pure rename | 30 min |
| 2 | Create `Surface`, `Divider`, `Alert` components | Low — new files | 1 hr |
| 3 | Create `FormLayout`, `ContentWithSidebar` | Low — new files | 30 min |
| 4 | Add typography CSS tokens | Low — CSS only | 15 min |
| 5 | Adopt Surface in pages and features (25 replacements) | Medium — touch many files | 2 hr |
| 6 | Adopt Alert in forms (6 replacements) | Low | 30 min |
| 7 | Adopt ContentWithSidebar in pages (7 replacements) | Medium — layout changes | 1 hr |
| 8 | Adopt FormLayout in forms (3 replacements) | Low | 15 min |
| 9 | Adopt typography tokens (38 replacements) | Medium — many files | 2 hr |
| 10 | Adopt Divider (5 replacements) | Low | 15 min |
| 11 | Remove `blifrivillig` feature (already flagged for removal) | N/A | When ready |

Total estimated effort: ~8 hours across 10 phases.

---

## Open questions

1. **Should `Card` from shadcn be re-themed to use `bg-card` or kept as-is?**  
   Currently shadcn's Card (`bg-background py-6 gap-6`) and our Surface
   (`bg-card p-5`) serve different purposes. Card has structured Header/Content/Footer
   sub-slots, Surface is a dumb panel. They can coexist.

2. **Should `font-heading` be a component (`<Heading>`) or stay as a CSS class?**  
   The current CSS-class approach works well — we add `font-heading` to any element
   that needs it. A component would be less flexible (can't apply to `<h2>`, `<span>`,
   `<p>` without `as` prop). Recommendation: keep as CSS class.

3. **Should we add a `Select` component that wraps the raw `<select>` (not shadcn's)?**  
   Currently `SelectField` already does this (label + hint + styled select). The
   standalone styled `<select>` (without label/hint) appears only in karaoke for
   duration and people count — these could use `SelectField` with minor adaptation.

4. **Typography tokens: CSS utilities vs Tailwind `@apply` vs dedicated component?**  
   CSS `@layer utilities` is the lightest option. No runtime cost, works everywhere.
   Could also add to Tailwind config's `theme.extend` for intellisense, but
   `@apply` in CSS is simpler and doesn't need VS Code plugin support.

5. **Should `bg-card` exist as a CSS variable?**  
   Yes — it's already defined in the Tailwind config or globals.css (need to verify).
   If not, it should be added to `@theme` for consistency with `bg-background`,
   `bg-muted`, etc.
