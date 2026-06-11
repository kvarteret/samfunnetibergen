# Interface Design System

This file records local UI conventions verified from `app/globals.css`,
`components/ui/button.tsx`, `components/ui/card.tsx`, event components, group
cards, room pages, and volunteer form components.

**Inspirations**: NHS design system / GOV.UK heritage (forms-first rigor),
neobrutalism (the existing visual language), brutalism (native elements where
they suffice, visible structure), Oatly (loud, copy-driven, typographic blocks).

## Tokens

- Tailwind 4 tokens are defined in `app/globals.css`.
- The base surface is `--background: #fff7e4`.
- Text and borders use the navy scale, with `--border: var(--navy-950)`.
- Primary action color is amber in this site (`--primary: var(--amber-500)`).
- Green/success ramp exists (`--success: var(--green-600)`) for status badges.
- Radius is intentionally square: `--radius: 0rem`.
- Brutalist depth uses `--shadow: 4px 4px 0 0 var(--border)` (default), with
  `--shadow-hard-sm` (2px) and `--shadow-hard-lg` (6px).

## Component Shape

- Prefer existing primitives in `components/ui/` before adding new UI
  primitives.
- Buttons use `Button` from `components/ui/button.tsx` when the control is a
  command or link action.
- Cards and repeated tiles use the canonical panel treatment
  (`border-2 border-border bg-card p-5 shadow-shadow`) where the surrounding
  feature already uses that pattern.
- Interactive cards and tiles use `interactive-brutal` for shared hover-lift /
  press-in physics.
- Keep layout Tailwind-forward and local to the component unless the pattern is
  already a shared primitive.

## Page Patterns

- Arrangement list/detail UI is in `features/events/components/` and
  `app/[locale]/arrangementer/`.
- Group cards are implemented in `features/grupper/components/GroupsFilter.tsx`
  and group detail pages under `app/[locale]/grupper/`.
- Room cards and room detail surfaces are under `app/[locale]/rom/`.

## Constraints

- Do not introduce rounded-card styles that contradict the square-token system.
- Do not create marketing hero abstractions for operational forms; keep form
  states explicit and source-backed.
- Do not duplicate design guidance in `.pi` or `.claude`; this file is the
  canonical design guidance for agents.
