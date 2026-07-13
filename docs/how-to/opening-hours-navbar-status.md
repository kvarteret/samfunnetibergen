# Keep opening status visible in the navbar

This guide explains how to maintain the opening/closing status in the global
navbar and release a change safely. It is a practical guide for maintainers and
editors working on Samfunnet i Bergen.

## Where the information comes from

The page layout fetches house-hours data once and passes it into the navbar:

`src/app/[locale]/layout.tsx` → `fetchHouseHours()` →
`src/lib/sanity/queries/pages.ts` → `src/components/navbar/Navbar.tsx` →
`src/components/navbar/NavbarOpenStatus.tsx`.

The Sanity `siteMetadata` singleton supplies the primary opening-hours rows,
vacation mode, and closed dates. In Studio, these are under **Åpningstider** →
**Primære åpningstider**. The public navbar does not fetch Sanity directly from
the browser.

`NavbarOpenStatus` calculates the current state with
`src/lib/opening-hours.ts`. When the house is open, the navbar shows the
closing time. When it is closed, it shows the next opening date or weekday and
time. The calculation uses Europe/Oslo wall-clock time.

## Change the navbar display

Edit `src/components/navbar/NavbarOpenStatus.tsx`. Keep the status and its
detail in the same trigger on both mobile and desktop. Use truncation or a
responsive maximum width if the available space is small; do not hide the
detail at mobile breakpoints.

If the value itself is wrong, inspect `openingHoursStatusAt()` and the Sanity
projection before changing the component. Do not add a second opening-hours
query to the navbar.

## Verify locally

From `/Users/kluvin/dev/kvarteret/samfunnetibergen`, run:

    TZ=UTC npx vitest run src/lib/opening-hours.test.ts
    TZ=Europe/Oslo npx vitest run src/lib/opening-hours.test.ts
    npm run lint
    npx next typegen && npx tsc --noEmit
    POSTHOG_CLI_API_KEY= POSTHOG_CLI_PROJECT_ID= npm run build

For a manual check, start the site with `npm run dev` and open
`http://localhost:3187/nb`. Check both a mobile-sized viewport and a desktop-
sized viewport. The navbar must show both the open/closed label and its
closing/next-opening detail. Open the status control and confirm that the
seven-day list is still present.

## Release the fix

Push the branch and open a PR so Vercel creates the preview deployment. After
the PR is merged, use the production workflow from the merged `develop` ref:

    gh workflow run release-production.yml --ref develop \
      -f ref=develop \
      -f promote=true \
      -f smoke_paths='/nb /nb/rom /nb/rom/book'

Find the run ID and watch it to completion:

    gh run list --workflow release-production.yml --limit 1
    gh run watch <run-id> --exit-status

The workflow runs format, lint, route type generation, TypeScript, tests, and a
production Vercel build. It then deploys a staged artifact, checks `/nb`,
`/nb/rom`, and `/nb/rom/book`, promotes the artifact, and creates a
`prod-YYYY.MM.DD.N` release tag. A dispatched workflow is not proof of a live
production deployment; the final run must be successful.

## Troubleshooting

If mobile shows only `Åpent` or `Stengt`, inspect the detail spans for
responsive `hidden` classes. If the result differs between a developer laptop
and CI, run the focused test with `TZ=UTC`; opening hours are Norwegian wall-
clock values and must not depend on the runner's timezone. If production data
is wrong, verify the published Sanity singleton and the `houseHoursQuery`
projection before changing presentation code.
