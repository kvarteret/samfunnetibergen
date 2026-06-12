# Replace Radix primitives with Base UI

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. This document follows `.agents/PLANS.md`.

## Purpose / Big Picture

The site currently mixes direct Radix imports, shadcn-style Radix wrappers, native disclosure controls, and application-specific selection components. After this migration, Base UI will provide the accessible behavior for navigation menus, dialogs, radio groups, toggle groups, and component composition. The application components will expose consistent APIs based on `value` and `onValueChange`, while preserving their distinct visual and semantic purposes.

The result is visible in the desktop `Mer` menu, the mobile menu, event and group filters, booking choices, karaoke date and time selection, and the design-system page. Keyboard navigation, focus handling, disabled states, hover opening, and selection styling must continue to work.

## Progress

- [x] (2026-06-12 07:30Z) Inventoried Radix dependencies, wrappers, and consumers.
- [x] (2026-06-12 07:42Z) Added Base UI and established shared radio, toggle, navigation, dialog, collapsible, button, and label foundations.
- [x] (2026-06-12 07:50Z) Migrated desktop navigation and the mobile dialog.
- [x] (2026-06-12 07:55Z) Migrated radio-based and toggle-based selection components to `value` and `onValueChange`.
- [x] (2026-06-12 08:00Z) Replaced Radix Slot composition with Base UI `render` and replaced Radix Label with the native label element.
- [x] (2026-06-12 08:02Z) Removed all direct Radix dependencies and source imports.
- [x] (2026-06-12 08:10Z) Passed targeted formatting, TypeScript, production build, and focused desktop/mobile interaction checks.
- [x] (2026-06-12 08:35Z) Replaced the inline desktop paper disclosure with a detached nested Base UI Navigation Menu while preserving the inline mobile disclosure.
- [x] (2026-06-12 08:40Z) Audited the remaining custom UI against Base UI and recorded prioritized replacements and deliberate non-migrations in `.agents/design-todo.md`.

## Surprises & Discoveries

- Observation: The repository uses both individual `@radix-ui/*` packages and the `radix-ui` aggregate package.
  Evidence: Imports exist in six source files, while `package.json` contains four individual packages plus `radix-ui`.

- Observation: Four visually different components already share one radio-group wrapper.
  Evidence: `SegmentedControl`, `SelectableCard`, `DateScroller`, and `SlotGrid` all render `RadioGroup` and `RadioGroupItem`.

- Observation: The uncommitted dependency change added Radix Dropdown Menu but did not add a consumer.
  Evidence: `package.json` contains the new dependency, while source search finds no dropdown-menu import.

- Observation: npm 11 rewrote the lockfile from the repository's four-space indentation to two spaces.
  Evidence: The first generated diff changed more than 50,000 lines; reformatting the JSON back to four spaces reduced the diff to dependency removal and addition.

- Observation: The production build still emits an existing Portable Text warning.
  Evidence: `[@portabletext/react] Unknown block type "undefined"` appeared during static generation, while the build completed successfully.

- Observation: Base UI renders a semantic radio element plus an `aria-hidden` native input for form submission.
  Evidence: Runtime DOM inspection showed one focusable `role="radio"` span and one visually hidden `aria-hidden="true"` input for each option.

## Decision Log

- Decision: Migrate to Base UI directly instead of preserving Radix-compatible wrapper props.
  Rationale: The user explicitly placed API improvements in scope and prefers the correct Base UI composition model over minimum-diff compatibility.
  Date/Author: 2026-06-12 / Codex

- Decision: Keep `SegmentedControl`, `SelectableCard`, `DateScroller`, and `SlotGrid` as separate application components over a shared Base UI radio foundation.
  Rationale: They share single-selection semantics but have different content models and layout responsibilities. Combining them would replace useful names with conditional props.
  Date/Author: 2026-06-12 / Codex

- Decision: Keep `ToggleGroup` separate.
  Rationale: It represents zero-or-more pressed buttons, not exactly-one form selection.
  Date/Author: 2026-06-12 / Codex

- Decision: Use Base UI `render` composition instead of retaining `asChild`.
  Rationale: This follows Base UI's native API, removes the Radix Slot dependency, and makes ownership of the rendered element explicit.
  Date/Author: 2026-06-12 / Codex

- Decision: Use a nested Base UI Navigation Menu for the desktop `Enda mer` surface and retain Collapsible on mobile.
  Rationale: The desktop control is a second navigation/settings level that benefits from coordinated hover, keyboard behavior, collision flipping, and a separately portaled surface. A detached hover submenu is not appropriate inside the narrow mobile dialog.
  Date/Author: 2026-06-12 / Codex

- Decision: Adopt Base UI incrementally at behavioral boundaries rather than replacing every application component with a similarly named primitive.
  Rationale: Field, Checkbox, Select, Number Field, Accordion, and Avatar add accessibility or interaction behavior. Static cards, domain previews, optimized content images, carousels, and file dropzones retain responsibilities Base UI does not provide.
  Date/Author: 2026-06-12 / Codex

## Outcomes & Retrospective

The application now uses `@base-ui/react@1.5.0` as its only direct headless component library. Desktop navigation, mobile dialog, paper disclosure, paper choice, radio controls, toggle controls, and polymorphic buttons were migrated. Component APIs now consistently use `value` and `onValueChange`; `SlotGrid` also uses `value` instead of `selectedValue`.

`npx tsc --noEmit`, the targeted Biome check, `git diff --check`, and `npm run build` pass. Browser verification confirmed the desktop menu opens, the nested paper selector updates `data-paper`, radio and toggle state updates, and the mobile menu exposes a modal dialog with no console errors. The browser automation surface could not faithfully synthesize pointer hover, but Base UI Navigation Menu is configured with `delay={0}` and `closeDelay={0}`, and click/keyboard-triggered opening was verified.

## Context and Orientation

The low-level wrappers live in `src/components/ui/`. `radio-group.tsx` supplies single-selection behavior to four application components. `toggle-group.tsx` owns multi-selection. `navigation-menu.tsx` supplies desktop navigation behavior to `src/components/navbar/Navbar.tsx`. `src/components/navbar/MobileMenu.tsx` directly uses Radix Dialog. `button.tsx` uses Radix Slot for polymorphic rendering, and `label.tsx` wraps Radix Label.

Base UI uses a `render` prop to replace or compose the default HTML element. Its stateful components expose data attributes and may accept class-name functions. The migration should use those APIs directly rather than translating all Base UI behavior back into Radix names.

## Plan of Work

Add `@base-ui/react` and inspect its installed TypeScript declarations before editing wrappers. Replace the radio, toggle, navigation, dialog, label, and button foundations. Normalize selection callbacks to `onValueChange`. Let parent components render their specialized option content through the application components rather than exposing raw primitive parts unless free composition is required.

For desktop navigation, use Base UI Navigation Menu because the content consists of links and nested website navigation. Configure immediate hover opening. Keep the `Mer` paper controls inside its content and replace the native desktop disclosure with a Base UI nested navigation or menu structure where appropriate. For mobile navigation, use Base UI Dialog and retain the full-screen layout.

After all consumers compile, remove every Radix package from `package.json` and regenerate `package-lock.json`. Search for remaining `radix`, `asChild`, and obsolete callback names.

## Concrete Steps

Run commands from `/Users/kluvin/dev/kvarteret/samfunnetibergen`.

Install the new primitive library and remove the old packages:

    npm install @base-ui/react
    npm uninstall @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-navigation-menu @radix-ui/react-slot radix-ui

After implementation, verify with:

    npx biome check .
    npx tsc --noEmit
    npm run build

Search for obsolete imports:

    rg -n "@radix-ui|from [\"']radix-ui[\"']|asChild" src package.json

The final search should return no Radix imports or Radix composition props.

## Validation and Acceptance

On desktop, moving the pointer onto `Mer` must open its menu immediately without requiring a click. Keyboard users must be able to focus the navigation trigger, open it, traverse links, and dismiss it. The paper selector must remain operable.

On mobile, opening and closing the full-screen menu must restore focus and prevent interaction with the page behind it.

Every radio-based component must show exactly one selected item with its border retained. Arrow-key behavior and disabled options must work. Toggle groups must permit multiple selections and keep selected borders. Booking, event filters, group filters, recurrence controls, karaoke dates, and karaoke slots must update their parent state.

Formatting, TypeScript, and the production build must pass. Existing warnings unrelated to this migration should be reported rather than hidden.

## Idempotence and Recovery

Dependency installation and verification commands are safe to rerun. Existing unrelated working-tree edits must remain untouched. If a component migration fails, keep changes scoped to its wrapper and consumers so the previous milestone can still be inspected without reverting unrelated files.

## Artifacts and Notes

Base UI's `render` prop replaces Radix Slot's `asChild` composition. Base UI Navigation Menu is appropriate for website navigation, while Base UI Menu is appropriate for action lists. Radio Group remains the semantic foundation for submitted single-choice values; Tabs must not be used for booking answers.

## Interfaces and Dependencies

The final dependency is `@base-ui/react`. No `@radix-ui/*` package or `radix-ui` aggregate package remains.

Selection components use `value` and `onValueChange`. `SegmentedControl<T>` accepts typed options and one `T` value. `ToggleGroup<T>` accepts typed options and a `T[]` value. `SelectableCardGroup` remains a compositional radio group for richer children. `DateScroller` and `SlotGrid` remain parent-rendered option collections with domain-specific data.

Revision note: Created on 2026-06-12 to capture the source-backed migration scope and decisions before implementation. Updated after implementation with completed milestones, verification evidence, and migration discoveries.
