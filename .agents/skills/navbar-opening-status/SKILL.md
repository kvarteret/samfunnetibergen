---
name: navbar-opening-status
description: Fix or change Samfunnet i Bergen navbar opening and closing status, dates, timestamps, mobile and desktop visibility, Sanity house-hours data, and deployment verification.
---

# Navbar Opening Status

Use this skill when the navbar should show whether the house is open or closed,
when it should show the next opening or closing time, or when that detail is
missing on mobile or desktop.

## Source path

The global locale layout fetches the house-hours content in
`apps/web/src/app/[locale]/layout.tsx` through `fetchHouseHours()`. The fetch
helper is `apps/web/src/lib/sanity/fetch/pages.ts`, and `houseHoursQuery` in
`apps/web/src/lib/sanity/queries/pages.ts` reads the published `siteMetadata` singleton:
shared opening hours, vacation mode, and closed dates.

`apps/web/src/components/navbar/Navbar.tsx` passes those values to the client
component `apps/web/src/components/navbar/NavbarOpenStatus.tsx`. That component calls
`openingHoursStatusAt()` and renders the status plus a detail such as
`Stenger kl. 21` or `Åpner fredag kl. 10`. The popover lists the next seven days.

## Implementation contract

Keep the status detail and separator rendered at every viewport width. The
trigger may truncate the detail to avoid pushing the logo or mobile menu out of
the viewport, but it must not use responsive `hidden` classes to remove the
opening or closing information on mobile.

Keep opening-hours calculations in `apps/web/src/lib/opening-hours.ts`. They are wall-
clock calculations for Europe/Oslo, not the machine's local timezone. Do not
move Sanity fetching into the client component or duplicate the Sanity query.

When changing the text, preserve the distinction between:

- open now: the current range's closing time;
- closed today: the next opening weekday/date and time;
- no configured opening range: `Ingen åpningstid funnet`.

## Verification

From the repository root, run the focused test in both timezone environments:

    TZ=UTC npm --workspace @samfunnet/web exec vitest run src/lib/opening-hours.test.ts
    TZ=Europe/Oslo npm --workspace @samfunnet/web exec vitest run src/lib/opening-hours.test.ts

Then run the repository checks:

    npm run lint
    npm run route-typegen && npm run typecheck
    POSTHOG_CLI_API_KEY= POSTHOG_CLI_PROJECT_ID= npm run build:web

For a visual check, start `npm run dev:web` and inspect `/nb` at a narrow mobile
viewport and a desktop viewport. Confirm that both `Åpent`/`Stengt` and the
`Stenger ...`/`Åpner ...` detail are visible in the navbar. Open the trigger and
confirm that the seven-day opening-hours list still appears.

## Common regression

If desktop shows the detail but mobile shows only `Åpent` or `Stengt`, search
`NavbarOpenStatus.tsx` for `hidden`, `sm:inline`, or `sm:flex` around the detail
span. If the detail is wrong only in CI, run the focused test with `TZ=UTC` and
trace the calculation through `openingHoursStatusAt()` rather than changing the
test date to match the runner timezone.
