<!-- One place on a shift: who is on it, or "Ledig", or "Sett inn <navn>". -->
<script lang="ts">
import { dropOp, readDrag, setDrag } from "../core/drag"
import type { Op } from "../core/ops"
import type { Person, Place, Shift, WeekBoard } from "../core/types"
import {
  ANSWER_WORD,
  answerOf,
  dayLabel,
  firstName,
  fitOf,
  isOpen,
  KIND_LABEL,
  levelOf,
  personById,
} from "../core/view"
import { cn } from "../lib/cn"

interface Props {
  board: WeekBoard
  shift: Shift
  place: Place
  selected: Person | null
  openSlot: number | null
  moveFrom: number | null
  busy: boolean
  onPlaceClick: (place: Place) => void
  onOp: (op: Op) => void
}

let {
  board,
  shift,
  place,
  selected,
  openSlot,
  moveFrom,
  busy,
  onPlaceClick,
  onOp,
}: Props = $props()

const ANSWER_TINT = {
  vil: "bg-answer-vil text-answer-vil-ink",
  kan: "bg-answer-kan text-answer-kan-ink",
  nei: "bg-answer-nei text-answer-nei-ink",
} as const

const open = $derived(isOpen(place))
const assignment = $derived(place.assignment)
const person = $derived(
  assignment && !assignment.cannot_attend
    ? personById(board, assignment.volunteer_id)
    : undefined,
)
const answer = $derived(person ? answerOf(shift, person.volunteer_id) : null)
const problems = $derived(person ? (assignment?.problems ?? []) : [])
const fit = $derived(
  selected && open ? fitOf(board, selected.volunteer_id, place.slot_id) : null,
)
const offer = $derived(fit?.ok ? fit : null)
const moving = $derived(moveFrom !== null)
const sick = $derived(
  assignment?.cannot_attend
    ? personById(board, assignment.volunteer_id)
    : undefined,
)
const label = $derived.by(() => {
  if (moving && moveFrom === place.slot_id) return "Flyttes …"
  if (moving)
    return open ? "Flytt hit" : `Bytt med ${firstName(person?.name ?? "")}`
  if (person) return person.name
  if (offer && selected) return `Sett inn ${firstName(selected.name)}`
  // Someone said "kan ikke i dag": the place counts as open, but it shows who
  // had it, so the leader sees at once that a replacement is needed.
  if (sick) return sick.name
  return "Ledig"
})
// Placing the selected person asks first when an approval is missing, they said
// "kan ikke" for the shift, or the server warns in red (see confirmationFor).
const asks = $derived(
  Boolean(
    offer &&
      (offer.needs_confirmation ||
        offer.warnings.some(note => note.level === "red") ||
        (selected && answerOf(shift, selected.volunteer_id) === "nei")),
  ),
)
const swapRequested = $derived(
  Boolean(person && assignment?.swap_requested && !assignment.cannot_attend),
)
const detail = $derived.by(() => {
  if (moving) return null
  if (swapRequested && !offer) return "Ønsker bytte"
  if (sick && offer)
    return `erstatter ${sick.name}${asks ? ", krever bekreftelse" : ""}`
  if (asks) return "Krever bekreftelse"
  if (sick) return "Kan ikke i dag, trenger erstatter"
  if (open && selected && fit && !fit.ok) return fit.reason
  return null
})
const warnings = $derived(offer?.warnings ?? problems)

function onDrop(event: DragEvent) {
  event.preventDefault()
  const data = readDrag(event)
  const op = data ? dropOp(data, place) : null
  if (op) onOp(op)
}
</script>

<!-- The accessible name is the visible text plus hidden context, so voice
     control users can say what they see (WCAG 2.5.3). The button is not
     disabled while saving: a disabled button drops keyboard focus. -->
<button
  type="button"
  data-slot={place.slot_id}
  aria-expanded={String(openSlot === place.slot_id) as "true" | "false"}
  aria-disabled={busy ? "true" : undefined}
  draggable={person ? "true" : "false"}
  class={cn(
    "focus-brutal group relative w-full min-h-11 cursor-pointer rounded-base border px-2 py-1 text-left transition-colors aria-disabled:cursor-wait",
    open
      ? "border-dashed border-foreground/30 bg-background hover:border-foreground/60"
      : "border-border bg-background hover:border-foreground/40",
    offer && "border-2 border-dashed border-secondary-700 bg-secondary-50",
    moving &&
      moveFrom !== place.slot_id &&
      "border-2 border-dashed border-secondary-700",
    levelOf(problems) === "red" && "border-2 border-warn-red",
    sick &&
      !offer &&
      !moving &&
      "border-2 border-dashed border-warn-red bg-answer-nei/40",
    selected &&
      person?.volunteer_id === selected.volunteer_id &&
      "outline-3 outline-secondary",
    openSlot === place.slot_id && "outline-3 outline-primary",
  )}
  onclick={() => onPlaceClick(place)}
  ondragover={event => event.preventDefault()}
  ondragstart={event => setDrag(event, { kind: "placed", slotId: place.slot_id })}
  ondrop={onDrop}
>
  <span
    class="block pr-14 text-[0.7rem] uppercase tracking-wider text-foreground-muted"
  >
    {KIND_LABEL[place.kind]}
    <span class="sr-only">{dayLabel(shift.day)}, {shift.title}.</span>
  </span>
  <span
    class={cn(
      "block truncate",
      person || (sick && !offer && !moving)
        ? "font-heading"
        : "text-foreground-muted",
      offer && "font-heading text-foreground",
    )}
  >
    {label}
  </span>
  {#if answer}
    <span
      class={cn(
        "absolute top-1 right-1.5 rounded-base px-1 text-[0.7rem]",
        ANSWER_TINT[answer],
      )}
    >
      <span class="sr-only">svar:</span>
      {ANSWER_WORD[answer]}
    </span>
  {/if}
  {#if detail}
    <span
      class={cn(
        "block text-[0.7rem]",
        sick && !offer
          ? "font-heading text-warn-red"
          : swapRequested && !offer
            ? "font-heading text-warn-yellow"
            : "text-foreground-muted",
      )}
    >
      {detail}
    </span>
  {/if}
  {#if warnings.length && !moving}
    <span
      class={cn(
        "block text-[0.7rem] font-heading",
        levelOf(warnings) === "red" ? "text-warn-red" : "text-warn-yellow",
      )}
    >
      <span aria-hidden="true">! </span>
      <span class="sr-only">{offer ? "Advarsel:" : "Problem:"}</span>
      {warnings.map(note => note.text).join(", ")}
    </span>
  {/if}
</button>
