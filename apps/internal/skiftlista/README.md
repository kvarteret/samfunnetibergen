# Skiftlista leader app (prototype)

The page where bar leaders see wishes and place people on shifts, as a
separate frontend for Kvarteret Personal. Svelte 5 with Vite (no SvelteKit),
Tailwind 4, the website's hs theme and Bits UI (MIT) for the sheet. By default it uses
**invented data only**: `src/core/fake.ts` plays Personal's part in memory and
resets on reload. With `?api=http` (development) or `VITE_LEADER_API=http`
(build) it reads the week from Personal instead, see "Live data" below.

## Run it

From the repository root:

    npm ci
    npm run dev:skiftlista

Open http://localhost:3190.

## Live data

`src/core/http.ts` is a `LeaderApi` that reads from Personal's leader API
(`GET /api/v1/leader/shifts/me` and `/weeks/{week_start}?group_id=`) through the
same-origin path `/personal/*`, and writes through the same path. In development Vite proxies `/personal/*`,
`/login`, `/logout` and `/static/*` to a local Personal (`http://localhost:8000`,
or `PERSONAL_URL`). Log in at Personal first, then open
`http://localhost:3190/?api=http`. The bar and week live in the address
(`?bar=7&uke=2026-11-02`). `TESTING.md` parts 7 and 8 have the click-by-click
steps (look, then change the week).

Writes (`placements`, `placements/swap`, `shifts/{id}/places` for "+",
`slots/{id}/seat` for "−", `weeks/{week}/status`) send
`X-CSRF-Token` (from `GET /me`), `If-Match` (the board's `version`) and, after
the popup, `confirmed`. Personal checks the `Origin` against its
`LEADER_APP_ORIGINS` setting, so a local Personal needs
`LEADER_APP_ORIGINS=http://localhost:3190` in its `.env`. A refusal (409) shows
Personal's own text and the page reads the week again.

Personal gives a slot with room for several people ONE slot id, so `toBoard()`
in `http.ts` gives every box its own app id `slot_id * 100 + seat` and copies a
slot's fit to each open seat. Nothing else in the app knows about seats.

A leader may place anyone: a person who lacks what the place needs is offered
with a red warning and `needs_confirmation`, and `src/lib/ConfirmDialog.svelte`
(Bits UI `AlertDialog`) asks before the action runs.

## Checks

    npm run typecheck:skiftlista          # svelte-check: types and Svelte's a11y warnings
    npm run test:skiftlista               # Vitest: the framework-free core
    npm --workspace @samfunnet/skiftlista run test:e2e   # Playwright: the whole page
    npm --workspace @samfunnet/skiftlista run build
    npx --no-install biome check apps/internal/skiftlista

`typecheck:skiftlista` and `test:skiftlista` are part of the root `typecheck`
and `test` scripts, so CI runs them. The browser tests are not in CI yet.

The browser tests need Chromium once: `npx playwright install chromium`
(inside `apps/internal/skiftlista`). On Linux it also needs a few system libraries:
`sudo npx playwright install-deps chromium`. Without sudo, unpack them
locally and point `LD_LIBRARY_PATH` at them:

    mkdir -p ~/.cache/ms-playwright/syslibs/debs && cd ~/.cache/ms-playwright/syslibs/debs
    apt-get download libnspr4 libnss3 libasound2t64
    for d in *.deb; do dpkg -x "$d" ../root; done
    export LD_LIBRARY_PATH=~/.cache/ms-playwright/syslibs/root/usr/lib/x86_64-linux-gnu

## Tooling notes

- **TypeScript 6 in this workspace only.** `svelte-check` 4.7 supports
  TypeScript 5 and 6, not 7, which the rest of the repository uses. npm keeps
  TypeScript 6 inside `apps/internal/skiftlista/node_modules`. When `svelte-check`
  supports 7, drop the pin (or use `typescript@~6` plus
  `@typescript/native@npm:typescript@7` and `svelte-check --tsgo`).
- **Biome sees only the `<script>` part of `.svelte` files.** It formats and
  lints that part, but would report everything used only in the markup as
  unused, so `apps/internal/skiftlista/biome.json` turns `noUnusedImports`,
  `noUnusedVariables` and `useConst` off for `.svelte` files. The markup is
  not formatted by any tool; `prettier-plugin-svelte` is the option if that
  becomes a problem. Svelte's own accessibility checks run in `svelte-check`.

## What to try

- Pick a person in "Folk denne uka": empty places that fit say "Sett inn
  <name>", with warnings as text. Click one to place.
- Click any place with nobody selected: the side panel lists Vil, Kan, Ikke
  svart and Kan ikke, fewest shifts first. On a filled place: "Fjern",
  "Flytt eller bytt" (then click a target place), or pick someone to swap in.
- Drag a person onto a place, or a placed person onto another place (move to
  empty, swap with filled). Dragging is a shortcut only; every drag has a
  click path.
- Click a day header to sort people by their answers for that day.
- The chips jump to the first problem, warning, open place or person without
  a shift.
- "Angre" or Ctrl+Z undoes up to 20 steps in the shown week. Escape steps back
  one level (move mode, place panel, selection, day).
- "Publiser uka", then change something: the status says "Endret etter
  publisering" and the box under the title says who changed it and when
  (Personal keeps it in two columns on the week's status row). A banner under the title says when the week is not published
  (or was changed after publishing) and goes away when it is published.
- Under a shift's places, the line "Skjenker: 2" has a "−" and a "+": one more
  place, or one empty place less (Kokk instead of Skjenker in the kitchen).
  Both are undone with "Angre" (each is the other's inverse). "−" never
  removes a person. Skiftleder and Opplæring have neither: a shift has exactly
  one skiftleder place, and training is a mode of a place, not a kind.
- "Last ned CSV" saves the week as one row per place (see
  `docs/how-to/skiftlista-leader-app.md`, "Export the week"). Open it in Excel
  or Google Sheets.
- Make the window narrower than 80rem (1280 px at 100 percent zoom): a place
  now opens in a sheet over the page instead of the side panel.

## Layout of the code

- `src/core/`: no Svelte imports. `types.ts` (the JSON contract the app needs
  from Personal), `fake.ts` (the in-memory stand-in), `ops.ts` (actions and
  their inverses for undo), `view.ts` (counting, sorting, wording), `drag.ts`
  (what a drop means), and their tests.
- `src/core/http.ts`: the real client and the translation of Personal's JSON
  (`toBoard`); `http.test.ts` tests it with a fake `fetch`.
- `src/board/`: the Svelte components (`WeekGrid`, `PlaceBox`, `RolePlaces`,
  `PeoplePanel`, `PlacePanel`, `Chip`); `src/App.svelte` holds the state.
- `src/lib/`: class recipes copied from `apps/web` (`button.ts`,
  `selection-control.ts`), `cn.ts`, and `SectionMark.svelte`.
- `src/lib/sheet/`: the one shadcn-svelte part in use, a Sheet (bottom side
  only) on Bits UI's Dialog, restyled with the hs tokens. Brought in by hand
  instead of with the shadcn-svelte CLI, so only what is used is here. Bits UI
  gives the focus trap, Escape and click-outside closing, and hides the page
  behind from screen readers. `App.svelte` shows the place panel in it when
  `window.matchMedia("(min-width: 80rem)")` is false, and beside the grid
  otherwise (one `PlacePanel` instance either way).
- `src/styles.css`: the website's hs tokens and paper background, copied from
  `apps/web/src/app/globals.css`, plus the answer colours and a darker red for
  filled red buttons (the website's own red fails contrast with white text).
- `e2e/`: the Playwright tests. They use only roles, visible text and the
  `data-slot` attribute, so they do not depend on the framework.
  `leader.spec.ts` runs in a laptop-sized window, `live.spec.ts` replays
  recorded Personal answers from `e2e/fixtures/` (demo data) so it needs no
  Personal, `narrow.spec.ts` (the sheet) in a 390 px wide one; `playwright.config.ts` has a project for each.
