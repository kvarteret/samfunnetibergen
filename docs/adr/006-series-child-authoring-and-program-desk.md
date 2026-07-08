# ADR 006: Series/festival child authoring and the Program desk

**Status:** Accepted (recommended path implemented 2026-07-08)
**Date:** 2026-07-08
**Relates to:** ADR 005 (materialized event instances) — this refines the Studio/authoring layer without changing ADR 005's content model.

## Implementation note (2026-07-08)

The recommended path (keep materialized instances; make them desk-second-class)
landed in `src/studio/structure.ts`:

- `BROWSE_EVENT_KINDS` (`single`, `seriesParent`, `festivalParent`) is applied
  to every browse list (Venter på godkjenning, Kommende, Promotert, Tidligere,
  Satt på pause, Avvist, Arkivert, Avlyst/utsatt). Generated instances no
  longer appear in any of them.
- `parentWithChildren` renders **Serier** and **Festivaler** as drill-ins:
  select a parent → **Rediger** (the parent editor) + **Instanser** (its
  occurrences in date order), so an occurrence is edited/cancelled from inside
  the parent.
- The Program menu is regrouped into *Trenger handling* / *Innhold* /
  *Visninger* + an "Absolutt alle (inkl. instanser)" escape hatch, matching
  section D.
- The old flat "Genererte – venter på godkjenning" queue was removed; pending
  instances are reviewed via the parent (section B).

Verified against the live dataset: "Kommende" dropped from 32 rows (27 quiz
instances spamming) to 5, the quiz series shows as a single parent row, and all
27 instances remain reachable under Serier → Quiz! → Instanser. No content-
model, query, or public-site change; `tsc`, `npm run test` (190 passed), and
`npm run build` green.

Instance preview legibility (section C) relies on the existing schema preview,
which selects `parentEvent.title` as a fallback — Studio resolves the reference
so instances read as "Quiz! · <date> · Serieinstans". The earlier generic
"Arrangement" rows were the pre-ADR-005 Studio build, not a preview bug.

## Context

ADR 005 shipped: a recurring event is now one `seriesParent` document plus N
generated `seriesInstance` children (one per occurrence), and festivals are a
`festivalParent` plus `festivalSession` children. This is working — the "Quiz!"
series expanded into 27 concrete child documents, each with its own id, slug,
date, and cancellable status.

The consequence is now visible in Studio and it is a real problem:

1. **Child instances spam the flat lists.** "Alle arrangementer" (and the
   other browse lists — Kommende, Tidligere, Promotert, …) show all 27 quiz
   instances as separate rows titled generically ("Arrangement · 2027-02-09 ·
   Godkjent"). A single weekly series buries every other event under a wall of
   near-identical rows. Add a few more series and the list is unusable.

2. **Children have no editing home under their parent.** ADR 005's promise —
   "cancel or edit one occurrence" — currently means *find that one document
   among 27 scattered rows in a flat list*. There is no "open the series, see
   its occurrences, edit one" flow. Editing a child is possible but not
   discoverable or parent-centric.

3. **The Program menu was designed for the pre-series world.** Its lists
   (Venter på godkjenning, Kommende, Promotert, Satt på pause, Tidligere,
   Avvist, Arkivert, Alle arrangementer) all assume every arrangement is a
   peer. With parents and instances now in the mix, the information
   architecture needs to distinguish *things you author* (singles, series
   parents, festival parents) from *things that are generated* (instances).

Underlying all three: **ADR 005 made instances first-class documents for the
public site's benefit** (durable URLs, per-occurrence status, feeds) **but they
should be second-class in the editorial desk.** An editor thinks in terms of
"the quiz series," not "27 quiz nights." The desk should mirror that.

This proposal does **not** revisit ADR 005's core decision to materialize
occurrences as documents. It changes how those documents are surfaced and
edited in Studio.

## Problems to solve

- Instances must stop appearing in top-level browse lists.
- An editor must be able to open a series/festival parent and edit, cancel, or
  add its occurrences from there.
- The Program desk must be reorganized around author-facing vs. generated
  documents and around what needs editorial action.
- Preview rows for instances must be legible (parent title + date, not
  "Arrangement").

## Proposal

### Principle: parents are browsed, instances are drilled into

Every top-level list that an editor browses shows **only concrete singles,
series parents, and festival parents** — never `seriesInstance` or
`festivalSession`. Instances are reached exclusively by opening their parent.
This is the single rule that removes the spam.

Concretely, every browse-list GROQ filter gains:

```groq
&& coalesce(eventKind, "single") in ["single", "seriesParent", "festivalParent"]
```

and instances are surfaced only through the parent-centric views below. One
escape-hatch list ("Absolutt alle") keeps every document reachable for
debugging and rare direct edits.

### A. Parent-centric child editing

Add **Serier** and **Festivaler** lists (of `seriesParent` / `festivalParent`
documents). Selecting a parent does not open the bare document editor; it opens
a split view whose child pane lists that parent's instances in date order, with
the parent's own editor reachable alongside. Editing, cancelling, or adding an
occurrence happens in that context.

Structure Builder shape (illustrative):

```ts
// Serier → list of seriesParent → [ Rediger serie | Instanser (children) ]
S.listItem()
  .title("Serier")
  .child(
    S.documentTypeList("arrangement")
      .filter('_type == "arrangement" && eventKind == "seriesParent"')
      .child(parentId =>
        S.list()
          .title("Serie")
          .items([
            S.listItem()
              .title("Rediger serie")
              .child(S.document().documentId(parentId).schemaType("arrangement")),
            S.listItem()
              .title("Instanser")
              .child(
                S.documentTypeList("arrangement")
                  .title("Instanser")
                  .filter('_type == "arrangement" && parentEvent._ref == $parentId')
                  .params({ parentId })
                  .defaultOrdering([{ field: "dates.0.startDate", direction: "asc" }]),
              ),
            S.listItem()
              .title("Generer / forleng")   // future: opens the generation action
              .child(/* generation UI or instructions */),
          ]),
      ),
  )
```

This gives the ADR 005 promise a real home: **open the series → see its
occurrences → edit or cancel one** — without that occurrence ever appearing in
a flat browse list. The same shape serves festivals (`festivalParent` →
sessions).

Generation itself stays the repo script for now (ADR 005 Decision D2); a
"Generer / forleng" document action on the parent is the natural next step and
slots into this view.

### B. Approval reviews the parent, not each instance

Publicly-submitted series enter as a pending `seriesParent`; ADR 005 already
generates children with the parent's approval status. So the **Venter på
godkjenning** queue should show *parents and singles only* (the browse-list
rule above already excludes instances). An editor approves the series once;
its instances were generated to match. No one reviews 27 rows.

### C. Instance preview legibility

Instance rows must read as "Quiz! · 2026-08-18 · Serieinstans". The schema
preview already selects `parentEvent.title` as a fallback; verify it actually
resolves the reference in the running Studio (the current screenshot shows the
generic "Arrangement", i.e. the fallback is not resolving — likely because the
Studio is running pre-ADR-005 code, but confirm). Instances should always show
parent title + their own date.

### D. Restructured Program menu

```
Program
├─ Innhold på arrangementsiden           (page singleton)
│
├─ ── Trenger handling ──
│   ├─ Venter på godkjenning             singles + parents, pending
│   ├─ Serier som må forlenges           seriesParent, horizon < 8 uker
│   └─ Avlyst eller utsatt               eventStatus in [cancelled, postponed]
│
├─ ── Innhold ──
│   ├─ Enkeltarrangementer               eventKind == single
│   ├─ Serier                            seriesParent → drill to instances (A)
│   └─ Festivaler                        festivalParent → drill to sessions (A)
│
├─ ── Visninger ──                        (parents + singles only, no instances)
│   ├─ Kommende
│   ├─ Promotert på forsiden
│   ├─ Tidligere
│   ├─ Satt på pause
│   ├─ Avvist
│   └─ Arkivert
│
├─ Absolutt alle (inkl. instanser)       escape hatch, everything
│
├─ ── divider ──
├─ Kategorier
└─ Arrangementtyper
```

Every list under "Trenger handling", "Innhold", and "Visninger" excludes
instance kinds; only "Absolutt alle" includes them. This replaces the M7 queues
added in ADR 005's execplan (Serier/Festivaler/Genererte/… as flat sibling
lists) with an IA that groups by *purpose* and hides generated noise.

### E. Cleaning up the current "Quiz!" state

The 27 quiz instances are **correct data and should be kept** — they are the
public occurrences. Once the browse-list rule (above) lands, they stop spamming
Studio automatically; no deletion needed. If instead you want to start the
series over from scratch (e.g. to re-seed times), the scoped, reversible path
is:

```
GENERATE_PARENT_ID=3rpjI1abmKeJaJDXiUkKcs npm run sanity:generate:instances   # review
# delete children explicitly (they are safe to delete — untouched, scheduled):
sanity documents delete <each arrangement.3rpjI1abmKeJaJDXiUkKcs.* id>
```

Recommendation: keep them; fix the desk. Deletion is only for a genuine re-seed.

## Alternative considered: collapse occurrences into the parent

Instead of hiding instance documents, store occurrences as an **embedded array
on the parent** (nested objects, not documents) and drop `seriesInstance`
entirely. Children would then be "editable in the parent" in the most literal
sense.

**Rejected.** This reverses ADR 005 wholesale: embedded occurrences have no
canonical URL, cannot be individually referenced or linked, cannot carry their
own SEO/feed entry, and re-introduce read-time expansion on every public
surface — the exact problems ADR 005 was written to eliminate, and the code
(M1–M7) just built. The desk pain is a UI problem; solving it by deleting the
content model is throwing away the house to fix a squeaky door. The parent-
centric *view* in section A delivers the "edit in the parent" feel without
sacrificing durable per-occurrence documents.

A middle option — embed occurrences but materialize documents lazily only when
an occurrence is cancelled/overridden — is more defensible but adds a
dual-representation complexity (which occurrences are documents vs. array
entries?) that ADR 005 deliberately avoided. Out of scope unless the pure
desk fix proves insufficient.

## Decision needed

The forking choice is section A vs. the Alternative:

- **Recommended:** keep materialized instances (ADR 005 intact); make them
  desk-second-class via the browse-list rule + parent-centric drill-in views.
  Pure Studio-structure and preview work; no content-model or public-site
  change.
- **Only if** you want occurrences to genuinely live inside the parent
  document: the embedded-array alternative, which reverses ADR 005 and unwinds
  M1–M7.

## Open questions

- Should "Kommende"/"Tidligere" show one collapsed row per series (a summary)
  rather than hiding instances entirely, so an editor still sees that the quiz
  runs? (Leaning: the series parent itself is that row.)
- Should cancelling a whole series from the parent view bulk-cancel future
  instances (ADR 005 mentions this as an explicit editor action)?
- Where does the "Generate / extend" action live — parent view button now, or
  wait for the Studio document action follow-up?

## Rollout (if recommended path is approved)

1. Add `BROWSE_EVENT_KINDS` (`single`, `seriesParent`, `festivalParent`) to
   `src/lib/sanity/queries` mirror or inline in `structure.ts`; apply it to
   every browse-list filter.
2. Rebuild `src/studio/structure.ts` Program section to the tree in section D,
   including the Serier/Festivaler drill-in child resolvers (section A).
3. Confirm/fix instance preview parent-title resolution (section C).
4. No content migration; no public query change; no feed change.
5. `npm run sanity:typegen` (structure-only changes usually need none), then
   verify in Studio that a series shows one row and its instances live under it.
```