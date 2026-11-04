<script lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Undo2,
} from "@lucide/svelte"
import { untrack } from "svelte"
import Chip from "./board/Chip.svelte"
import PeoplePanel from "./board/PeoplePanel.svelte"
import PlacePanel from "./board/PlacePanel.svelte"
import WeekGrid from "./board/WeekGrid.svelte"
import { csvFileName, weekToCsv } from "./core/export"
import { addDays, FIRST_WEEK } from "./core/fake"
import { NotSignedInError } from "./core/http"
import {
  inverseOf,
  type Op,
  occupant,
  pushUndo,
  run,
  type UndoEntry,
  weekKeyOf,
} from "./core/ops"
import {
  type LeaderApi,
  type LeaderMe,
  type Note,
  type Place,
  RefusedError,
  type WeekBoard,
} from "./core/types"
import {
  type Confirmation,
  changedBy,
  confirmationFor,
  type Filter,
  firstName,
  isOpen,
  longDate,
  type PlaceRef,
  personById,
  placeName,
  placeRef,
  STATUS_TEXT,
  summarize,
  weekLabel,
} from "./core/view"
import { buttonVariants } from "./lib/button"
import ConfirmDialog from "./lib/ConfirmDialog.svelte"
import { cn } from "./lib/cn"
import SectionMark from "./lib/SectionMark.svelte"
import { selectionControlVariants } from "./lib/selection-control"
import { Sheet, SheetContent } from "./lib/sheet"

const UNPUBLISHED_HELP: Record<"open" | "changed_after_publish", string> = {
  open: "Frivillige ser ikke skiftene sine før du trykker «Publiser uka».",
  changed_after_publish:
    "Endringene er lagret, og frivillige ser dem med en gang. Trykk «Publiser uka» igjen når du er ferdig.",
}

interface Message {
  text: string
  warnings: Note[]
  error: boolean
}

interface AppProps {
  api: LeaderApi
  /** The week to open when the address names none. */
  initialWeek?: string
  /** The prototype's fake data covers a few weeks; real data has no limit. */
  limitWeeks?: boolean
  /** True when the data comes from Personal (changes are not built yet). */
  live?: boolean
}

let {
  api,
  initialWeek = FIRST_WEEK,
  limitWeeks = true,
  live = false,
}: AppProps = $props()

// The bar and the week live in the address (?bar=7&uke=2026-11-02), so a
// reload or a shared link opens the same page.
const params = new URLSearchParams(window.location.search)
const urlBar = Number(params.get("bar")) || null
const urlWeek = /^\d{4}-\d{2}-\d{2}$/.test(params.get("uke") ?? "")
  ? (params.get("uke") as string)
  : null

let me = $state<LeaderMe | null>(null)
let barId = $state<number | null>(null)
// Only the first value matters: after that the leader's clicks move the week.
let weekStart = $state(untrack(() => urlWeek ?? initialWeek))
let board = $state<WeekBoard | null>(null)
let busy = $state(false)
// Loading and errors while reading from the server.
let weekLoading = $state(false)
let loadError = $state<{ text: string; signIn: boolean } | null>(null)
let loadTick = $state(0)
let selectedId = $state<number | null>(null)
let openSlot = $state<number | null>(null)
let moveFrom = $state<number | null>(null)
let focusDay = $state<string | null>(null)
let query = $state("")
let filter = $state<Filter>("alle")
let message = $state<Message | null>(null)
let undo = $state<UndoEntry[]>([])
let showMissing = $state(false)
// "Gjør til utkast" hides the week from volunteers, so it asks first.
let confirmUnpublish = $state(false)
// The big warning: set when the leader tries to place someone who lacks what
// the place needs; the action runs only after the popup is confirmed.
let pendingConfirm = $state<{ op: Op; confirmation: Confirmation } | null>(null)
// After an action, focus goes to the changed place (as on Personal's week
// page). It waits for the render that shows the new week.
/** A place (its slot id) or a CSS selector to put keyboard focus on. */
let pendingFocus = $state<number | string | null>(null)
// From 80rem (Tailwind's xl) the place panel sits beside the grid; below it
// the panel opens in a sheet over the page. Same breakpoint as the grid's
// two-column layout in the markup below.
const wideQuery = window.matchMedia("(min-width: 80rem)")
let wide = $state(wideQuery.matches)

const selected = $derived(
  board && selectedId !== null ? (personById(board, selectedId) ?? null) : null,
)
const summary = $derived(board ? summarize(board) : null)
const currentUndo = $derived(
  board
    ? undo.filter(entry => entry.weekKey === weekKeyOf(board as WeekBoard))
    : [],
)
const openRef = $derived<PlaceRef | null>(
  board && openSlot !== null ? placeRef(board, openSlot) : null,
)
const lastWeek = $derived(board?.strip.at(-1)?.week_start ?? weekStart)

function describe(error: unknown): { text: string; signIn: boolean } {
  if (error instanceof NotSignedInError)
    return { text: "Du er ikke logget inn i Personal.", signIn: true }
  if (error instanceof RefusedError)
    return { text: error.message, signIn: false }
  return {
    text: "Fikk ikke kontakt med Personal. Sjekk nettet og prøv igjen.",
    signIn: false,
  }
}
const statusTone = $derived(
  board?.status === "published"
    ? "bg-answer-vil text-answer-vil-ink"
    : board?.status === "changed_after_publish"
      ? "bg-answer-kan text-answer-kan-ink"
      : "bg-secondary-50 text-secondary-950",
)

$effect(() => {
  const update = () => (wide = wideQuery.matches)
  wideQuery.addEventListener("change", update)
  return () => wideQuery.removeEventListener("change", update)
})

$effect(() => {
  void loadTick
  api
    .me()
    .then(result => {
      me = result
      loadError = null
      barId =
        result.bars.find(bar => bar.id === (barId ?? urlBar))?.id ??
        result.bars[0]?.id ??
        null
    })
    .catch(error => {
      loadError = describe(error)
    })
})

$effect(() => {
  void loadTick
  const id = barId
  const start = weekStart
  if (id === null) return
  let current = true
  weekLoading = true
  api
    .week(id, start)
    .then(result => {
      if (!current) return
      board = result
      loadError = null
    })
    .catch(error => {
      if (!current) return
      // With a week on screen the old one stays and the error is a message.
      if (board)
        message = { text: describe(error).text, warnings: [], error: true }
      else loadError = describe(error)
    })
    .finally(() => {
      if (current) weekLoading = false
    })
  return () => {
    current = false
  }
})

// Keep ?bar= and ?uke= in step with what is shown (other parameters stay).
$effect(() => {
  if (!board) return
  const next = new URLSearchParams(window.location.search)
  next.set("bar", String(board.bar.id))
  next.set("uke", board.week_start)
  window.history.replaceState(null, "", `?${next}`)
})

$effect(() => {
  if (pendingFocus === null || busy || !board) return
  const selector =
    typeof pendingFocus === "string"
      ? pendingFocus
      : `[data-slot="${pendingFocus}"]`
  document.querySelector<HTMLElement>(selector)?.focus()
  pendingFocus = null
})

// Another leader may have changed the week while this tab was in the
// background. When the tab comes back, read the week again (at most every 15
// seconds, never in the middle of a write or a question) and say so if it changed.
let lastRefresh = 0
async function refreshWeek() {
  const current = board
  if (!current || busy || weekLoading || pendingConfirm || confirmUnpublish)
    return
  if (Date.now() - lastRefresh < 15_000) return
  lastRefresh = Date.now()
  try {
    const fresh = await api.week(current.bar.id, current.week_start)
    if (
      board &&
      !busy &&
      fresh.version !== board.version &&
      fresh.bar.id === board.bar.id &&
      fresh.week_start === board.week_start
    ) {
      board = fresh
      message = {
        text: `Uka er oppdatert. ${changedBy(fresh.last_changed)}`.trim(),
        warnings: [],
        error: false,
      }
    }
  } catch {
    // Stay quiet: the next write says plainly if something is wrong.
  }
}

$effect(() => {
  const onReturn = () => {
    if (document.visibilityState === "visible") void refreshWeek()
  }
  window.addEventListener("focus", onReturn)
  document.addEventListener("visibilitychange", onReturn)
  return () => {
    window.removeEventListener("focus", onReturn)
    document.removeEventListener("visibilitychange", onReturn)
  }
})

function labelFor(op: Op, current: WeekBoard): string {
  const name = (id: number | null) =>
    id === null ? "" : (personById(current, id)?.name ?? "")
  switch (op.type) {
    case "place":
      return `${name(op.volunteerId)} satt inn`
    case "remove":
      return `${name(occupant(current, op.slotId))} fjernet`
    case "replace":
      return `${name(op.volunteerId)} byttet inn`
    case "move":
      return `${name(occupant(current, op.fromSlotId))} flyttet`
    case "swap":
      return "bytte"
    case "status":
      return op.status === "published" ? "publisering" : "åpning"
    case "addPlace":
      return "ny plass"
    case "removePlace":
      return "plass fjernet"
  }
}

/** What the leader reads when a write did not go through. */
function failureText(error: unknown): string {
  if (error instanceof RefusedError) return error.message
  if (error instanceof NotSignedInError)
    return "Ikke lagret: du er ikke lenger logget inn i Personal."
  return "Ikke lagret: fikk ikke kontakt med Personal. Sjekk nettet og prøv igjen."
}

/** `undone` is the undo entry this run takes back, if it is an undo. */
async function execute(op: Op, label: string, undone: UndoEntry | null = null) {
  const current = board
  if (!current || busy) return
  busy = true
  try {
    const result = await run(api, current, op)
    // The inverse is read from the answer, so it points at where the person is
    // now, which can be another seat than the one dropped on.
    const inverse = undone ? null : inverseOf(op, current, result.board)
    board = result.board
    message = { text: result.message, warnings: result.warnings, error: false }
    if (undone) undo = undo.filter(entry => entry !== undone)
    else if (inverse)
      undo = pushUndo(undo, { weekKey: weekKeyOf(current), label, inverse })
    openSlot = null
    moveFrom = null
    pendingFocus =
      op.type === "place" || op.type === "remove" || op.type === "replace"
        ? op.slotId
        : op.type === "move"
          ? op.toSlotId
          : op.type === "swap"
            ? op.slotB
            : op.type === "addPlace"
              ? `[data-plus="${op.shiftId}-${op.kind}"]`
              : op.type === "removePlace"
                ? `[data-minus="${op.shiftId}-${op.kind}"]`
                : null
  } catch (error) {
    message = { text: failureText(error), warnings: [], error: true }
    if (error instanceof NotSignedInError) loadError = describe(error)
    // An undo that was refused can never work; drop it so it does not block
    // the older ones. After a lost connection it stays, for another try.
    if (undone && error instanceof RefusedError)
      undo = undo.filter(entry => entry !== undone)
    // Read the week again so the screen shows what the server has. If that
    // fails too, the old week stays and the message above says it was not saved.
    try {
      board = await api.week(current.bar.id, current.week_start)
    } catch (reloadError) {
      if (reloadError instanceof NotSignedInError)
        loadError = describe(reloadError)
    }
  } finally {
    busy = false
  }
}

function targetSlot(op: Op): number | null {
  switch (op.type) {
    case "place":
    case "remove":
    case "replace":
      return op.slotId
    case "move":
      return op.toSlotId
    case "swap":
      return op.slotB
    case "status":
    case "addPlace":
    case "removePlace":
      return null
  }
}

function doOp(op: Op) {
  if (!board) return
  const confirmation = confirmationFor(board, op)
  if (confirmation) {
    pendingConfirm = { op, confirmation }
    return
  }
  execute(op, labelFor(op, board))
}

function confirmPending() {
  const pending = pendingConfirm
  pendingConfirm = null
  if (!pending || !board) return
  const op = { ...pending.op, confirmed: true } as Op
  execute(op, labelFor(op, board))
}

function cancelPending() {
  const pending = pendingConfirm
  pendingConfirm = null
  // Back to the place the leader was working on.
  const slot = pending ? targetSlot(pending.op) : null
  if (slot !== null) pendingFocus = slot
}

function undoLast() {
  const last = currentUndo.at(-1)
  if (last) execute(last.inverse, last.label, last)
}

/** Saves the week shown as a CSV file: nothing is sent anywhere, the browser builds it. */
function downloadCsv() {
  if (!board) return
  const file = new Blob([weekToCsv(board)], { type: "text/csv;charset=utf-8" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(file)
  link.download = csvFileName(board)
  link.click()
  URL.revokeObjectURL(link.href)
}

function onPlaceClick(place: Place) {
  if (!board) return
  if (moveFrom !== null) {
    if (moveFrom === place.slot_id) {
      moveFrom = null
      return
    }
    doOp(
      isOpen(place)
        ? { type: "move", fromSlotId: moveFrom, toSlotId: place.slot_id }
        : { type: "swap", slotA: moveFrom, slotB: place.slot_id },
    )
    return
  }
  const fit = selected && board.fit[selected.volunteer_id]?.[place.slot_id]
  if (selected && isOpen(place) && fit?.ok) {
    doOp({
      type: "place",
      slotId: place.slot_id,
      volunteerId: selected.volunteer_id,
    })
    return
  }
  openSlot = openSlot === place.slot_id ? null : place.slot_id
}

function closePlace() {
  pendingFocus = openSlot
  openSlot = null
}

function startMove(slotId: number) {
  openSlot = null
  moveFrom = slotId
  pendingFocus = slotId
}

function changeWeek(start: string) {
  message = null
  openSlot = null
  moveFrom = null
  focusDay = null
  weekStart = start
}

function pickBar(id: number) {
  message = null
  openSlot = null
  moveFrom = null
  selectedId = null
  focusDay = null
  query = ""
  filter = "alle"
  barId = id
}

// Escape steps back one level; Ctrl/Cmd+Z undoes. No single-key shortcuts,
// so nothing fires while a screen reader user types (WCAG 2.1.4).
function onKeydown(event: KeyboardEvent) {
  const target = event.target instanceof Element ? event.target : null
  const typing = target?.closest("input, textarea")
  if ((event.ctrlKey || event.metaKey) && event.key === "z" && !typing) {
    event.preventDefault()
    undoLast()
    return
  }
  if (event.key !== "Escape") return
  // In the sheet, Bits UI closes it on Escape (and onOpenChange moves focus).
  if (!wide && openSlot !== null && moveFrom === null) return
  if (typing && (typing as HTMLInputElement).value) return
  if (moveFrom !== null) {
    pendingFocus = moveFrom
    moveFrom = null
  } else if (openSlot !== null) closePlace()
  else if (selectedId !== null) selectedId = null
  else if (focusDay !== null) focusDay = null
}

function problemTitle(refs: PlaceRef[]): string {
  return refs
    .map(
      ref =>
        `${placeName(ref)}: ${ref.place.assignment?.problems.map(note => note.text).join(", ")}`,
    )
    .join("\n")
}
</script>

<svelte:window onkeydown={onKeydown} />

{#if loadError}
  <div class="mx-auto flex max-w-xl flex-col gap-4 p-8" role="alert">
    <h1 class="text-3xl">Fikk ikke hentet skiftlista</h1>
    <p>{loadError.text}</p>
    <div class="flex flex-wrap gap-2">
      {#if loadError.signIn}
        <a class={buttonVariants()} href="/login">Logg inn i Personal</a>
      {/if}
      <button
        type="button"
        class={buttonVariants({ variant: "neutral" })}
        onclick={() => {
          loadError = null
          loadTick += 1
        }}
      >
        Prøv igjen
      </button>
    </div>
  </div>
{:else if !me || !board || !summary}
  <p class="p-8" role="status">Laster skiftplanen …</p>
{:else}
  <div class="flex min-h-dvh flex-col">
    <a
      class="focus-brutal sr-only rounded-base bg-card p-2 focus:not-sr-only focus:absolute focus:z-10"
      href="#people-panel"
    >
      Gå til folk
    </a>
    <!-- Like the website's navbar: brand left, text links right, the active
         link underlined in the house red. -->
    <header class="noprint bg-background">
      <div
        class="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6"
      >
        <p class="flex items-center gap-2.5 text-primary">
          <SectionMark class="h-5" />
          <span
            class="text-2xl font-heading leading-none [font-family:var(--font-display)]"
          >
            Skiftlista
          </span>
          <span class="sr-only">, Samfunnet i Bergen</span>
        </p>
        <nav aria-label="Barer" class="flex flex-wrap items-center">
          {#each me.bars as bar (bar.id)}
            {@const active = bar.id === board.bar.id}
            <button
              type="button"
              aria-current={active ? "page" : undefined}
              class={cn(
                "focus-brutal relative cursor-pointer px-3 py-2.5 font-heading text-foreground hover:text-primary",
                active &&
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary",
              )}
              onclick={() => pickBar(bar.id)}
            >
              {bar.name}
            </button>
          {/each}
        </nav>
        <p class="ml-auto text-sm text-foreground-muted">{me.name}</p>
      </div>
    </header>

    <div class="paper-surface flex-1">
      <div class="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-5 sm:px-6">
        <!-- Title block in the website's page-title style. -->
        <section aria-label="Uke" class="flex flex-col gap-4">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div class="flex flex-col gap-1.5">
              <p class="text-sm text-foreground-muted">
                Skiftplan for {board.bar.name}
              </p>
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-4xl leading-none sm:text-5xl">
                  Uke {board.week_number}
                </h1>
                <span
                  class={cn("rounded-base px-2 py-0.5 text-sm font-heading", statusTone)}
                >
                  {STATUS_TEXT[board.status]}
                </span>
              </div>
              <p class="text-foreground-muted">
                {weekLabel(board).replace(/^Uke \d+ \((.*)\)$/, "$1")}
                · Har svart
                <strong class="text-foreground">{summary.answered}</strong>
                av {board.people.length} ·
                <button
                  type="button"
                  aria-controls="missing-list"
                  aria-expanded={showMissing ? "true" : "false"}
                  class="focus-brutal cursor-pointer underline decoration-1 underline-offset-4 hover:text-primary"
                  onclick={() => (showMissing = !showMissing)}
                >
                  {showMissing ? "Skjul hvem" : "Vis hvem"}
                </button>
                {#if board.deadline}
                  · Svarfrist {longDate(board.deadline)}
                {/if}
              </p>
              {#if showMissing}
                <p class="text-sm" id="missing-list">
                  Ikke svart denne uka:
                  {summary.notAnswered.map(person => person.name).join(", ") ||
                    "ingen"}
                </p>
              {/if}
            </div>
            <nav aria-label="Uker" class="noprint flex items-center gap-2">
              <button
                type="button"
                aria-label="Forrige uke"
                class={selectionControlVariants({ size: "square" })}
                disabled={limitWeeks && board.week_start <= FIRST_WEEK}
                onclick={() => board && changeWeek(addDays(board.week_start, -7))}
              >
                <ChevronLeft aria-hidden="true" class="size-4" />
              </button>
              {#each board.strip as item (item.week_start)}
                {@const current = item.week_start === board.week_start}
                <button
                  type="button"
                  aria-current={current ? "true" : undefined}
                  aria-label={`Uke ${item.number}, ${STATUS_TEXT[item.status]}`}
                  class={cn(
                    selectionControlVariants({ selected: current }),
                    "rounded-full px-4",
                  )}
                  onclick={() => changeWeek(item.week_start)}
                >
                  {item.number}{item.status === "published" ? " ✓" : ""}
                </button>
              {/each}
              <button
                type="button"
                aria-label="Neste uke"
                class={selectionControlVariants({ size: "square" })}
                disabled={limitWeeks && board.week_start >= lastWeek}
                onclick={() => board && changeWeek(addDays(board.week_start, 7))}
              >
                <ChevronRight aria-hidden="true" class="size-4" />
              </button>
            </nav>
          </div>

          {#if board.status !== "published"}
            <section
              aria-label="Publisering"
              class={cn(
                "noprint rounded-base border-2 border-dashed p-3 text-sm",
                board.status === "open"
                  ? "border-secondary bg-secondary-50 text-secondary-950"
                  : "border-answer-kan-ink bg-answer-kan text-answer-kan-ink",
              )}
            >
              <strong class="font-heading">
                {board.status === "open"
                  ? "Uka er ikke publisert."
                  : "Uka er endret etter publisering."}
              </strong>
              {UNPUBLISHED_HELP[board.status]}
              {changedBy(board.last_changed)}
            </section>
          {/if}

          <div class="noprint flex flex-wrap items-center gap-2">
            {#if summary.problems.length}
              <Chip
                tone="red"
                title={problemTitle(summary.problems)}
                onclick={() => {
                  if (summary) openSlot = summary.problems[0].place.slot_id
                }}
              >
                ! {summary.problems.length}
                {summary.problems.length === 1 ? "problem" : "problemer"}
              </Chip>
            {/if}
            {#if summary.warnings.length}
              <Chip
                tone="yellow"
                title={problemTitle(summary.warnings)}
                onclick={() => {
                  if (summary) openSlot = summary.warnings[0].place.slot_id
                }}
              >
                {summary.warnings.length}
                {summary.warnings.length === 1 ? "advarsel" : "advarsler"}
              </Chip>
            {/if}
            {#if summary.sick.length}
              <Chip
                tone="red"
                title={summary.sick.map(placeName).join("\n")}
                onclick={() => {
                  if (summary) openSlot = summary.sick[0].place.slot_id
                }}
              >
                {summary.sick.length} trenger erstatter
              </Chip>
            {/if}
            {#if summary.swaps.length}
              <Chip
                tone="yellow"
                title={summary.swaps.map(placeName).join("\n")}
                onclick={() => {
                  if (summary) openSlot = summary.swaps[0].place.slot_id
                }}
              >
                {summary.swaps.length} ønsker bytte
              </Chip>
            {/if}
            {#if summary.open.length}
              <Chip
                title={summary.open.map(placeName).join("\n")}
                onclick={() => {
                  if (summary) openSlot = summary.open[0].place.slot_id
                }}
              >
                {summary.open.length} ledige
              </Chip>
            {/if}
            {#if summary.withoutShift.length}
              <Chip
                title={`Har svart, men har ikke skift: ${summary.withoutShift.map(person => person.name).join(", ")}`}
                onclick={() => {
                  if (!summary) return
                  filter = "alle"
                  query = ""
                  selectedId = summary.withoutShift[0].volunteer_id
                }}
              >
                {summary.withoutShift.length} uten skift
              </Chip>
            {/if}
            <span class="grow"></span>
            <button
              type="button"
              class={cn(selectionControlVariants(), "gap-2 font-base")}
              disabled={busy || !currentUndo.length}
              title="Ctrl+Z"
              onclick={undoLast}
            >
              <Undo2 aria-hidden="true" class="size-4" />
              Angre{currentUndo.length ? ` ${currentUndo.at(-1)?.label}` : ""}
            </button>
            <button
              type="button"
              class={cn(selectionControlVariants(), "gap-2 font-base")}
              onclick={() => window.print()}
            >
              <Printer aria-hidden="true" class="size-4" />
              Skriv ut
            </button>
            <button
              type="button"
              class={cn(selectionControlVariants(), "gap-2 font-base")}
              title="Én rad per plass, åpnes i Excel og Google Sheets"
              onclick={downloadCsv}
            >
              <Download aria-hidden="true" class="size-4" />
              Last ned CSV
            </button>
            {#if board.status !== "published"}
              <button
                type="button"
                class={cn(buttonVariants(), "bg-cta")}
                disabled={busy}
                onclick={() => doOp({ type: "status", status: "published" })}
              >
                Publiser uka
              </button>
            {:else}
              <button
                type="button"
                class={buttonVariants({ variant: "neutral" })}
                disabled={busy}
                onclick={() => (confirmUnpublish = true)}
              >
                Gjør til utkast
              </button>
            {/if}
          </div>
          <div aria-live="polite" class="noprint min-h-8 text-sm" role="status">
            {#if weekLoading}
              <p class="px-3 py-1.5 text-foreground-muted">Laster uka …</p>
            {/if}
            {#if message}
              <p
                class={cn(
                  "flex flex-wrap items-center gap-2 rounded-base px-3 py-1.5",
                  message.error
                    ? "bg-answer-nei text-answer-nei-ink"
                    : "bg-answer-vil text-answer-vil-ink",
                )}
              >
                <span>
                  {message.text}{message.warnings.length
                    ? ` Advarsel: ${message.warnings.map(note => note.text).join(", ")}.`
                    : ""}
                </span>
                <button
                  type="button"
                  class="focus-brutal ml-auto cursor-pointer underline underline-offset-4"
                  onclick={() => (message = null)}
                >
                  Lukk melding
                </button>
              </p>
            {/if}
          </div>
          {#if moveFrom !== null}
            <p
              class="noprint rounded-base border-2 border-dashed border-secondary bg-secondary-50 p-2 text-sm"
            >
              Velg en ledig plass å flytte til, eller en person å bytte med.
              Escape avbryter.
            </p>
          {/if}
        </section>

        <main
          class="board-main grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]"
        >
          <WeekGrid
            {board}
            {busy}
            {focusDay}
            {moveFrom}
            {openSlot}
            {selected}
            onFocusDay={day => {
              focusDay = day
              selectedId = null
            }}
            onOp={doOp}
            {onPlaceClick}
          />
          <aside
            class="noprint flex max-h-[36rem] min-h-0 flex-col xl:max-h-[calc(100dvh-14rem)]"
          >
            {#if openRef && wide}
              <PlacePanel
                {board}
                {busy}
                placeRef={openRef}
                onClose={closePlace}
                onOp={doOp}
                onStartMove={startMove}
              />
            {:else}
              <PeoplePanel
                {board}
                {filter}
                {focusDay}
                {selected}
                bind:query
                onClearDay={() => (focusDay = null)}
                onFilter={value => (filter = value)}
                onSelect={person => {
                  selectedId = person?.volunteer_id ?? null
                  focusDay = null
                }}
              />
            {/if}
          </aside>
        </main>
        {#if !wide}
          <!-- Narrow screens: the place opens in a sheet over the page. -->
          <Sheet
            open={openRef !== null}
            onOpenChange={open => {
              if (!open) closePlace()
            }}
          >
            {#if openRef}
              <SheetContent
                labelledby="place-heading"
                onOpenAutoFocus={event => event.preventDefault()}
                onCloseAutoFocus={event => event.preventDefault()}
              >
                <PlacePanel
                  {board}
                  {busy}
                  framed={false}
                  placeRef={openRef}
                  onClose={closePlace}
                  onOp={doOp}
                  onStartMove={startMove}
                />
              </SheetContent>
            {/if}
          </Sheet>
        {/if}
        <ConfirmDialog
          open={confirmUnpublish}
          title="Gjøre uka til utkast?"
          subject={board ? `Uke ${board.week_number} for ${board.bar.name} er publisert nå.` : ""}
          warnings={[
            {
              text: "Frivillige ser ikke skiftene sine før uka er publisert igjen.",
              level: "red",
            },
          ]}
          confirmLabel="Gjør til utkast"
          onConfirm={() => {
            confirmUnpublish = false
            doOp({ type: "status", status: "open" })
          }}
          onCancel={() => (confirmUnpublish = false)}
        />
        <ConfirmDialog
          open={pendingConfirm !== null}
          title={pendingConfirm
            ? `Sette inn ${firstName(pendingConfirm.confirmation.person.name)} likevel?`
            : ""}
          subject={pendingConfirm?.confirmation.subject ?? ""}
          warnings={pendingConfirm?.confirmation.warnings ?? []}
          confirmLabel="Sett inn likevel"
          onConfirm={confirmPending}
          onCancel={cancelPending}
        />
        <footer class="noprint text-xs text-foreground-muted">
          {live
            ? "Leser fra og lagrer i Personal. Alt du endrer lagres med en gang."
            : "Prototype med oppdiktede data. Ingenting lagres."}
          Tastatur: Tab mellom
          plasser, Enter velger, Escape går ett steg tilbake, Ctrl+Z angrer.
          {selected ? `Valgt: ${firstName(selected.name)}.` : ""}
        </footer>
      </div>
    </div>
  </div>
{/if}
