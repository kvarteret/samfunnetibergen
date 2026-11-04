<!-- "Folk denne uka": search, filters and the people in the leader's pool. -->
<script lang="ts">
import { setDrag } from "../core/drag"
import type { Person, WeekBoard } from "../core/types"
import {
  ANSWER_WORD,
  dayAnswer,
  dayLabel,
  FILTERS,
  type Filter,
  filterPeople,
  hoursText,
} from "../core/view"
import { buttonVariants } from "../lib/button"
import { cn } from "../lib/cn"
import { selectionControlVariants } from "../lib/selection-control"

interface Props {
  board: WeekBoard
  query: string
  filter: Filter
  focusDay: string | null
  selected: Person | null
  onFilter: (filter: Filter) => void
  onSelect: (person: Person | null) => void
  onClearDay: () => void
}

let {
  board,
  query = $bindable(),
  filter,
  focusDay,
  selected,
  onFilter,
  onSelect,
  onClearDay,
}: Props = $props()

const people = $derived(filterPeople(board, query, filter, focusDay))

function meta(person: Person): string {
  const parts: string[] = []
  const day = focusDay ? dayAnswer(board, focusDay, person.volunteer_id) : null
  if (day) {
    parts.push(ANSWER_WORD[day])
    if (focusDay && person.busy_days.includes(focusDay)) parts.push("har skift")
  } else if (person.answer_status === "ikke_svart") {
    parts.push("ikke svart")
  }
  parts.push(
    `${person.week_shifts} skift i uka · ${person.month_shifts} i måneden${person.week_minutes ? ` · ${hoursText(person.week_minutes)}` : ""}`,
  )
  if (person.max_shifts !== null) parts.push(`maks ${person.max_shifts}`)
  parts.push(...person.tags)
  if (person.max_shifts !== null && person.week_shifts > person.max_shifts)
    parts.push("over maks")
  return parts.join(" · ")
}
</script>

<section
  id="people-panel"
  aria-labelledby="people-heading"
  class="flex min-h-0 flex-col gap-3 rounded-base border border-border bg-panel p-4 shadow-shadow"
>
  <h2 id="people-heading" class="text-lg">Folk denne uka</h2>
  {#if focusDay}
    <p
      class="flex items-center justify-between gap-2 rounded-base bg-card p-2 text-sm"
    >
      <span>
        Sortert etter svar for <strong>{dayLabel(focusDay)}</strong>.
      </span>
      <button
        type="button"
        class={buttonVariants({ size: "sm", variant: "neutral" })}
        onclick={onClearDay}
      >
        Fjern dag
      </button>
    </p>
  {/if}
  <label class="flex flex-col gap-1 text-sm">
    Søk etter navn
    <input
      type="search"
      class="focus-brutal h-11 rounded-base border border-input bg-card px-3"
      bind:value={query}
    />
  </label>
  <fieldset class="flex flex-wrap gap-1.5">
    <legend class="sr-only">Vis</legend>
    {#each FILTERS as item (item.key)}
      <button
        type="button"
        aria-pressed={filter === item.key ? "true" : "false"}
        class={cn(
          selectionControlVariants({
            selected: filter === item.key,
            size: "none",
          }),
          "min-h-9 rounded-full px-3 text-sm font-heading",
        )}
        onclick={() => onFilter(item.key)}
      >
        {item.label}
      </button>
    {/each}
  </fieldset>
  <p aria-live="polite" class="text-xs text-foreground-muted">
    Viser {people.length} av {board.people.length}
  </p>
  {#if selected}
    <p
      class="flex items-center justify-between gap-2 rounded-base border border-secondary bg-secondary-50 p-2 text-sm"
    >
      <span>
        Valgt: <strong>{selected.name}</strong>. Ledige plasser som passer sier
        «Sett inn».
      </span>
      <button
        type="button"
        class={buttonVariants({ size: "sm", variant: "neutral" })}
        onclick={() => onSelect(null)}
      >
        Fjern valg
      </button>
    </p>
  {/if}
  <ul
    aria-label="Personer"
    class="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1"
  >
    {#each people as person (person.volunteer_id)}
      {@const isSelected = selected?.volunteer_id === person.volunteer_id}
      <li>
        <button
          type="button"
          draggable="true"
          aria-pressed={isSelected ? "true" : "false"}
          class={cn(
            "focus-brutal flex w-full cursor-grab flex-col rounded-base border px-2 py-1.5 text-left",
            isSelected
              ? "border-2 border-secondary bg-secondary text-secondary-foreground"
              : "border-border bg-card hover:border-foreground/40",
          )}
          onclick={() => onSelect(isSelected ? null : person)}
          ondragstart={event =>
            setDrag(event, { kind: "person", volunteerId: person.volunteer_id })}
        >
          <span class="flex items-baseline justify-between gap-2">
            <span class="font-heading">{person.name}</span>
            {#if person.is_skiftleder}
              <span class="text-xs" title="Godkjent skiftleder">Skiftleder</span>
            {/if}
          </span>
          <span
            class={cn(
              "text-xs",
              !isSelected &&
                (person.answer_status === "ikke_svart"
                  ? "text-warn-red"
                  : "text-foreground-muted"),
            )}
          >
            {meta(person)}
          </span>
          {#if person.note}
            <span class={cn("text-xs italic", !isSelected && "text-foreground-muted")}>
              «{person.note}»
            </span>
          {/if}
        </button>
      </li>
    {:else}
      <li class="p-2 text-sm text-foreground-muted">Ingen treff.</li>
    {/each}
  </ul>
  <p class="text-xs text-foreground-muted">
    Velg en person og trykk på en ledig plass, eller dra personen dit.
  </p>
</section>
