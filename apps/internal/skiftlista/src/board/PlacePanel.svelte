<!-- One place opened: who fits it, grouped by answer, plus remove and move. -->
<script lang="ts">
import { X } from "@lucide/svelte"
import type { Op } from "../core/ops"
import type { WeekBoard } from "../core/types"
import {
  type Candidate,
  candidates,
  dayLabel,
  hoursText,
  KIND_LABEL,
  levelOf,
  type PlaceRef,
  personById,
} from "../core/view"
import { buttonVariants } from "../lib/button"
import { cn } from "../lib/cn"

interface Props {
  board: WeekBoard
  placeRef: PlaceRef
  busy: boolean
  /** false inside the narrow-screen sheet, which draws the frame itself */
  framed?: boolean
  onClose: () => void
  onOp: (op: Op) => void
  onStartMove: (slotId: number) => void
}

let {
  board,
  placeRef,
  busy,
  framed = true,
  onClose,
  onOp,
  onStartMove,
}: Props = $props()

const GROUPS = [
  ["vil", "Vil"],
  ["kan", "Kan"],
  ["none", "Ikke svart"],
  ["nei", "Kan ikke"],
  ["unqualified", "Uten godkjenning, krever bekreftelse"],
] as const

let heading = $state<HTMLHeadingElement | null>(null)

const shift = $derived(placeRef.shift)
const place = $derived(placeRef.place)
const assignment = $derived(place.assignment)
const current = $derived(
  assignment && !assignment.cannot_attend
    ? personById(board, assignment.volunteer_id)
    : undefined,
)
const sick = $derived(
  assignment?.cannot_attend
    ? personById(board, assignment.volunteer_id)
    : undefined,
)
const groups = $derived(candidates(board, placeRef))

// Focus the heading each time another place is opened.
$effect(() => {
  void place.slot_id
  heading?.focus()
})

function pick(candidate: Candidate) {
  const volunteerId = candidate.person.volunteer_id
  onOp(
    current
      ? { type: "replace", slotId: place.slot_id, volunteerId }
      : { type: "place", slotId: place.slot_id, volunteerId },
  )
}
</script>

<section
  id="place-panel"
  aria-labelledby="place-heading"
  class={cn(
    "flex min-h-0 flex-col gap-3",
    framed && "rounded-base border-2 border-secondary bg-panel p-4 shadow-shadow",
  )}
>
  <div class="flex items-start justify-between gap-2">
    <div>
      <h2
        id="place-heading"
        class="text-lg outline-none"
        tabindex="-1"
        bind:this={heading}
      >
        {KIND_LABEL[place.kind]}, {dayLabel(shift.day)}
      </h2>
      <p class="text-sm text-foreground-muted">
        {shift.title}
        {shift.time_label}{place.kind === "skiftleder"
          ? " · bare godkjente skiftledere"
          : ""}
      </p>
    </div>
    <button
      type="button"
      aria-label="Lukk plassen"
      class={buttonVariants({ size: "icon", variant: "plain" })}
      onclick={onClose}
    >
      <X aria-hidden="true" />
    </button>
  </div>
  {#if sick}
    <p class="rounded-base bg-answer-nei p-2 text-sm text-answer-nei-ink">
      {sick.name} har meldt kan ikke i dag. Den du velger tar plassen, og
      {sick.name} tas av.
    </p>
  {/if}
  {#if current}
    <div class="flex flex-col gap-2 rounded-base bg-card p-2">
      <p class="text-sm">
        På plassen nå: <strong>{current.name}</strong>
        {#if assignment?.problems.length}
          <span
            class={cn(
              "block font-heading",
              levelOf(assignment.problems) === "red"
                ? "text-warn-red"
                : "text-warn-yellow",
            )}
          >
            {levelOf(assignment.problems) === "red" ? "Problem" : "Advarsel"}: {assignment.problems.map(note => note.text).join(", ")}
          </span>
        {/if}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class={buttonVariants({ size: "sm", variant: "neutral" })}
          disabled={busy}
          onclick={() => onStartMove(place.slot_id)}
        >
          Flytt eller bytt
        </button>
        <button
          type="button"
          class={buttonVariants({ size: "sm", variant: "neutral" })}
          disabled={busy}
          onclick={() => onOp({ type: "remove", slotId: place.slot_id })}
        >
          Fjern {current.name}
        </button>
      </div>
      <p class="text-xs text-foreground-muted">
        Eller velg en annen under for å bytte person.
      </p>
    </div>
  {/if}
  <div class="-mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1">
    {#each GROUPS as [key, title] (key)}
      <div>
        <h3
          class="mb-1 text-sm font-heading uppercase tracking-wider text-foreground-muted"
        >
          {title} ({groups[key].length})
        </h3>
        {#if groups[key].length}
          <ul class="flex flex-col gap-1">
            {#each groups[key] as candidate (candidate.person.volunteer_id)}
              {@const warnings = candidate.fit.ok ? candidate.fit.warnings : []}
              <li>
                <button
                  type="button"
                  class={cn(
                    "focus-brutal flex min-h-11 w-full cursor-pointer flex-col rounded-base border border-border bg-card px-2 py-1.5 text-left hover:border-foreground/40 disabled:cursor-wait",
                    key === "nei" && "border-dashed",
                  )}
                  disabled={busy}
                  onclick={() => pick(candidate)}
                >
                  <span class="flex justify-between gap-2">
                    <span class="font-heading">
                      {candidate.person.name}{candidate.person.is_skiftleder
                        ? " · SL"
                        : ""}
                    </span>
                    <span class="text-xs text-foreground-muted">
                      {candidate.person.week_shifts} uka · {candidate.person
                        .month_shifts} mnd{candidate.person.week_minutes
                        ? ` · ${hoursText(candidate.person.week_minutes)}`
                        : ""}
                    </span>
                  </span>
                  {#if warnings.length}
                    <span
                      class={cn(
                        "text-xs font-heading",
                        levelOf(warnings) === "red"
                          ? "text-warn-red"
                          : "text-warn-yellow",
                      )}
                    >
                      Advarsel: {warnings.map(note => note.text).join(", ")}
                    </span>
                  {/if}
                  {#if candidate.person.note}
                    <span class="text-xs italic text-foreground-muted">
                      «{candidate.person.note}»
                    </span>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-foreground-muted">Ingen.</p>
        {/if}
      </div>
    {/each}
    <p class="text-xs text-foreground-muted">
      Å vise folk fra andre barer med riktig godkjenning kommer senere.
    </p>
  </div>
</section>
