# Interface Design System

This file records local UI conventions verified from `app/globals.css`,
`components/ui/button.tsx`, `components/ui/card.tsx`, event components, group
cards, room pages, and volunteer form components.

## Tokens

- Tailwind 4 tokens are defined in `app/globals.css`.
- The base surface is `--background: #fff7e4`.
- Text and borders use the navy scale, with `--border: var(--navy-950)`.
- Primary action color is amber in this site (`--primary: var(--amber-500)`).
- Radius is intentionally square: `--radius: 0rem`.
- Brutalist depth uses `--shadow: 4px 4px 0 0 var(--border)`.

## Component Shape

- Prefer existing primitives in `components/ui/` before adding new UI
  primitives.
- Buttons use `Button` from `components/ui/button.tsx` when the control is a
  command or link action.
- Cards and repeated tiles use strong borders, `bg-card`, and `shadow-shadow`
  where the surrounding feature already uses that pattern.
- Keep layout Tailwind-forward and local to the component unless the pattern is
  already a shared primitive.

## Page Patterns

- Arrangement list/detail UI is in `features/events/components/` and
  `app/[locale]/arrangementer/`.
- Group cards are implemented in `features/grupper/components/GroupsFilter.tsx`
  and group detail pages under `app/[locale]/grupper/`.
- Room cards and room detail surfaces are under `app/[locale]/rom/` and
  `components/room/`.

## Constraints

- Do not introduce rounded-card styles that contradict the square-token system.
- Do not create marketing hero abstractions for operational forms; keep form
  states explicit and source-backed.
- Do not duplicate design guidance in `.pi` or `.claude`; this file is the
  canonical design guidance for agents.
