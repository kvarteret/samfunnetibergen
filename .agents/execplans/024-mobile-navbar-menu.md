# Streamline the mobile navigation without changing desktop navigation

This ExecPlan is a living document. It follows `.agents/PLANS.md` and must be
kept current as implementation and verification progress changes.

## Purpose / Big Picture

On a phone, visitors should be able to open the full-screen menu and immediately
understand the five primary destinations without being confronted by every
secondary link. Booking, Nyttig info, and Mer will open one inline group at a
time. Booking will expose Alle rom and Karaoke; Nyttig info will expose a
content-backed Vergeordning shortcut; Mer will expose its existing links and
the existing nested Enda mer appearance/paper controls. Every group starts
closed when the menu opens, closes on navigation, remains keyboard accessible,
and leaves the desktop navigation unchanged.

The result is visible at the local web app's mobile viewport: open the menu,
expand each group, resize to a short viewport, switch to English, and verify
that the dialog remains scrollable and that selected theme/paper preferences
persist.

## Progress

- [x] (2026-09-14) Read repository guidance, the existing navigation/content
  source, the verification/type-generation skills, and the supplied visual
  references.
- [x] (2026-09-14) Created branch `codex/mobile-navbar-menu` from the clean
  checkout.
- [x] (2026-09-14) Added a lightweight Sanity projection/fetch helper for
  useful-info section metadata and derived the published Vergeordning anchor
  from its source `_key`.
- [x] (2026-09-14) Refactored the mobile menu to controlled, exclusive primary
  disclosures and preserved Enda mer inside Mer.
- [x] (2026-09-14) Added focused state/source-selector coverage and Norwegian /
  English localization strings, including language-switch close behavior.
- [x] (2026-09-14) Ran TypeGen, repository tests/typechecks, lint/format checks,
  web build, and responsive browser verification with implementation states.
- [x] (2026-09-14) Committed as `ecb3a91`, pushed `codex/mobile-navbar-menu`,
  and opened [PR #140](https://github.com/kvarteret/samfunnetibergen/pull/140)
  against `develop`; no merge or deploy performed.

## Surprises & Discoveries

- Observation: `MobileMenu.tsx` currently renders every child group immediately
  and renders linkless parent labels as paragraphs, so expandable parents are
  not interactive.
  Evidence: `apps/web/src/components/navbar/MobileMenu.tsx` maps children
  unconditionally and `renderNavItemLabel` returns `<p>` when no direct link is
  present.
- Observation: `PaperMenuSection` already owns a mobile `Enda mer` disclosure
  and uses the existing persistent theme and paper preference components.
  Evidence: `apps/web/src/components/navbar/PaperPicker.tsx` renders
  `Collapsible.Root`, `ThemeChoices`, and `PaperChoices` when `mobile` is true.
- Observation: Useful-info section anchors are the Sanity section `_key` values,
  not a hard-coded slug or title transformation.
  Evidence: `apps/web/src/features/nyttig/SectionBlock.tsx` exports
  `sectionMeta`, and `NyttigPage.tsx` passes its `id` to `SectionNav`; the
  rendered section components consume that id through `InfoSection`.
- Observation: The current installed dependencies are not present in this
  checkout, so the Next guide under `node_modules/next/dist/docs/` cannot yet be
  read. Dependency installation is required before framework verification.
- Observation: The first Turbopack dev-server launch could not spawn its pooled
  Node process because this shell did not expose the mise-managed Node binary on
  `PATH`; running the same Next version with the repository's Node path and
  `--webpack` provided a working local server for browser verification.
  Evidence: the initial launch failed with `No such file or directory` while
  writing the CSS module endpoint; the webpack launch served `/nb/` and all
  tested routes successfully.
- Observation: The published useful-info section is titled “Vergeordningen” in
  Norwegian and “The guardian arrangement” in English, while its rendered
  anchor is `_key` `7d0eec2032cc`.
  Evidence: the read-only published Sanity query returned the section metadata;
  the browser rendered `/nyttig#7d0eec2032cc` and scrolled to that section.

## Decision Log

- Decision: Keep the current Base UI primitives and existing full-screen Dialog;
  do not introduce a second accordion/sheet stack.
  Rationale: The repository already wraps Base UI and the user asked for a
  shadcn-style interaction, not a generator migration. Reusing the existing
  primitives reduces interaction and styling risk.
  Date/Author: 2026-09-14 / Codex.
- Decision: Make only the mobile menu controlled; leave `Navbar.tsx`'s desktop
  navigation data and `DesktopNav` interaction intact except for supplying the
  same verified useful-info destination where appropriate.
  Rationale: Desktop is considered working well and the requested change is
  primarily mobile.
  Date/Author: 2026-09-14 / Codex.
- Decision: Fetch only useful-info section metadata for the navbar and select
  the section whose localized title/heading identifies Vergeordning, then build
  `/nyttig#<section _key>`. Do not duplicate the section key or guess an anchor.
  Rationale: `sectionMeta` makes `_key` the source of truth, while a lightweight
  projection avoids loading rich Portable Text into the layout solely for a
  shortcut. If the published section is absent, keep Nyttig info as a normal
  destination and omit the stale shortcut.
  Date/Author: 2026-09-14 / Codex.
- Decision: Reset the primary open key and the nested Enda mer state by
  remounting the menu content on a closed-to-open cycle, while also keeping
  primary expansion controlled and exclusive.
  Rationale: The user explicitly requires all expandable groups to start closed
  on every opening and the nested disclosure to remain under Mer.
  Date/Author: 2026-09-14 / Codex.
- Decision: Keep the visible shortcut labels in the translation files while
  querying only the published section identity/semantic match for the href.
  Rationale: The required Norwegian label is “Vergeordning,” but the CMS copy
  is “Vergeordningen”; using the translation preserves the requested navigation
  wording without duplicating the mutable anchor or page content.
  Date/Author: 2026-09-14 / Codex.

## Outcomes & Retrospective

Implementation, verification, and PR delivery are complete. The mobile
dialog now starts collapsed, allows only one primary group at a time, derives
Vergeordning from published section metadata, keeps Enda mer under Mer, closes
on links and language navigation, scrolls on short viewports, localizes its
labels, preserves preference persistence, and leaves desktop navigation
structure intact. The browser check also exercised desktop Booking and Mer
dropdowns at a 1280×900 viewport.

## Context and Orientation

The repository is a Next.js App Router website with a Sanity content layer. The
locale layout at `apps/web/src/app/[locale]/layout.tsx` fetches shared data and
renders `Navbar`; `Navbar.tsx` creates the ordered five-item navigation and
keeps the desktop `NavigationMenu`; `MobileMenu.tsx` is the client-side
full-screen mobile dialog. `PaperPicker.tsx` is shared by desktop and mobile
and must continue to own the existing appearance controls.

Sanity queries live in `apps/web/src/lib/sanity/queries/`, reusable projections
in `apps/web/src/lib/sanity/fragments/`, and fetch helpers in
`apps/web/src/lib/sanity/fetch/`. `usefulInfoPageQuery` currently returns full
page sections. The page uses `sectionMeta` in
`apps/web/src/features/nyttig/SectionBlock.tsx` to define the rendered anchor
id from each section's `_key`, so a navbar shortcut must receive that metadata
from Sanity rather than inventing a fragment.

Tests use Vitest under `apps/web/src`; the repository-wide commands are listed
in `package.json`. The verification skill requires narrow checks first and a
full cycle when dependencies, queries, routing, or build-sensitive files are
changed. Sanity query changes require `npm run sanity:typegen` and review of the
generated type diffs.

## Plan of Work

First install or otherwise expose the repository dependencies, then read the
relevant Next guide from the installed package before relying on framework APIs.
Add a small query/projection that returns `_key`, `_type`, and the localized
section label used by `sectionMeta`; add a fetch helper and a typed helper that
selects the Vergeordning section without hard-coded ids. Pass the resulting
optional href into `Navbar` and render a localized Nyttig info child only when
the published metadata supplies it.

Refactor `MobileMenu.tsx` so linkless parents render a full-width button with
`aria-expanded`, `aria-controls`, and a visible chevron. Directly linked parents
remain links, but Booking needs a button plus an inline Alle rom link because
its parent destination must stay reachable. Use a single `openItemKey` state
for primary groups and render only the selected group's child list. Ensure each
group's child links are at least 44px tall, preserve external-link behavior,
close the dialog on internal/external navigation, and keep the existing
`PaperMenuSection mobile` nested inside Mer with the exact label Enda mer.
Reset the primary key and remount the menu body on every fresh opening so
previous disclosures cannot leak between openings. Preserve safe-area padding,
focus behavior supplied by Base UI Dialog, and overflow scrolling.

Add focused tests for the pure useful-info selector and the menu state model or
render behavior. If the repository has no DOM test environment, test the
state transition helper directly and supplement it with browser verification;
do not add a new test framework solely for this change. Add missing Norwegian
and English strings through the existing `Navigation` messages.

## Concrete Steps

Run from `/Users/kluvin/.codex/worktrees/6700/samfunnetibergen`.

    npm install
    find node_modules/next/dist/docs -maxdepth 2 -type f | sort | head
    npm run sanity:typegen
    npm run typecheck:web
    npm run lint:web
    npm run test:web

Create or update only the files needed for the navigation, Sanity metadata,
translations, tests, and this plan. Use `apply_patch` for source edits. After
query changes, run:

    npm run sanity:typegen
    npm run typecheck:web

Start the app for manual verification:

    npm run dev:web

Use a browser at `http://localhost:3197/nb/` and `http://localhost:3197/en/`
with a narrow viewport and a short viewport. Capture actual implementation
screenshots for the initial menu, Booking, Nyttig info, Mer, and Mer + Enda
mer. Also inspect a desktop viewport and verify the desktop dropdown remains
usable. Confirm links navigate and close the dialog, including the same-page
Vergeordning anchor, and that theme/paper selection persists after closing and
reopening.

Before delivery, run the narrow relevant checks and then the full web checks if
the repository has no fresh CI result for this commit:

    npm run test:web
    npm run typecheck:web
    npm run lint:web
    npm run build:web

Observed verification: `npm run test` passed with 59 web test files (354 web
tests), 22 Studio test files (125 tests), and 2 content-domain test files (35
tests); `npm run typecheck`, `npm run lint:web`, TypeGen, focused Biome checks,
and `npm run build:web` all passed. Browser verification covered narrow mobile
initial/Booking/Nyttig info/Mer/Enda mer states, English, language switching,
preference selection/reopen reset, same-page navigation closing, and a wide
desktop viewport. The local dev browser logged the repository's existing
Sanity CORS/live-preview warnings because localhost:3197 is not an allowed
published Sanity origin; published content still rendered correctly.

Inspect `git diff`, commit the implementation on `codex/mobile-navbar-menu`,
push the branch, discover the repository's target branch from GitHub metadata,
and create a PR. Do not merge or deploy.

## Validation and Acceptance

The implementation is accepted when a human can verify all of the following:

1. Opening the mobile dialog shows Bli frivillig, Arrangementer, Booking,
   Nyttig info, and Mer in that order; all expandable groups begin closed.
2. Opening Booking shows Alle rom and Karaoke and keeps `/rom` reachable.
3. Opening Nyttig info shows Oversikt and a prominent Vergeordning shortcut
   whose href contains the published section `_key`; it is not a guessed
   `#vergeordning` fragment.
4. Opening Mer shows Kontakt, Sponsorer, Link i bio, Offentlige dokumenter
   with an external-link icon/behavior, then Enda mer. Enda mer begins closed,
   expands independently, and preserves the existing HS/Skyss and Rutenett,
   Punktark, Linjert, Blankt controls and persistence.
5. Opening one primary group closes any other primary group. Closing and
   reopening the dialog returns every primary and nested disclosure to closed.
6. Internal navigation, external navigation, and same-page anchor navigation
   close the dialog; focus returns to the menu trigger through Dialog behavior.
7. The content remains reachable by scrolling on a short viewport, respects
   safe-area space, has visible keyboard focus, and uses touch targets of at
   least 44 CSS pixels for submenu links.
8. English labels and behavior work, and desktop navigation has no regression.
9. Tests/typecheck/lint/build pass for the changed web app, and TypeGen output
   contains only the expected query additions.

## Idempotence and Recovery

The code changes are additive and safe to rerun. TypeGen is deterministic; if
generated types contain unrelated drift, review and revert only unrelated
generated changes before continuing. If browser verification exposes a desktop
regression, keep the mobile-only state/render changes isolated and restore the
desktop branch of the component before opening the PR. Do not delete Sanity
content or preferences. If the metadata selector finds no Vergeordning section,
the safe fallback is a plain `/nyttig` link and a reported limitation, never a
guessed fragment.

## Artifacts and Notes

The three supplied visual references are local-only design references under
`/Users/kluvin/.codex/generated_images/01a09f0e-fcdc-7991-a40a-12352537adf0/`.
The first incorrectly places appearance controls in the footer; the latest
reference is authoritative for keeping Enda mer inside Mer. These files should
not be committed.

## Interfaces and Dependencies

The mobile component should continue to receive `items: NavItem[]` and `logo`
and may receive an optional `usefulInfoHref` or a child item already derived by
the server. The Sanity metadata type should expose at least:

    type UsefulInfoSectionNavigation = {
      _key: string
      label: string | null
    }

The menu's primary state should be represented by one nullable key, not a set
of booleans, so exclusivity is structural. `PaperMenuSection mobile` remains
the only owner of the nested preference controls. Existing Base UI Dialog,
Collapsible, and the repository's `cn` utility are the dependencies to reuse.

## Change Notes

- 2026-09-14: Initial plan created after source inspection and reference-image
  review. The plan explicitly preserves Enda mer under Mer and makes the
  Vergeordning anchor source-backed through the useful-info section `_key`.
- 2026-09-14: Implementation and verification completed; recorded the
  source-backed metadata behavior, Node/Turbopack environment workaround, and
  full check/browser evidence.
- 2026-09-14: Committed as `ecb3a91`, pushed `codex/mobile-navbar-menu`, and
  opened PR #140 against `develop`; no merge or deploy performed.
