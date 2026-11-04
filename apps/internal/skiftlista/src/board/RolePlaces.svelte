<!-- "− +" for one role on a shift: take one empty place away, or add one. One
     row per role (Skjenker in the bars, Kokk in the kitchen). The row does not
     depend on the shift still having such a place, so after "−" at the last
     one the shift can get one back. Buttons use aria-disabled, not disabled,
     so keyboard focus stays where it is. Not on paper. -->
<script lang="ts">
import type { Op } from "../core/ops"
import type { PlaceKind, Shift } from "../core/types"
import { dayLabel, KIND_LABEL } from "../core/view"
import { cn } from "../lib/cn"

interface Props {
  kind: PlaceKind
  shift: Shift
  busy: boolean
  onOp: (op: Op) => void
}

let { kind, shift, busy, onOp }: Props = $props()

const total = $derived(shift.places.filter(p => p.kind === kind).length)
const empty = $derived(
  shift.places.filter(p => p.kind === kind && p.assignment === null).length,
)
const label = $derived(KIND_LABEL[kind].toLowerCase())
const where = $derived(`${dayLabel(shift.day)}, ${shift.title}`)
const button =
  "focus-brutal flex size-8 cursor-pointer items-center justify-center rounded-base border border-border bg-background text-base leading-none hover:border-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-60"

function minus() {
  if (busy || empty === 0) return
  onOp({ type: "removePlace", shiftId: shift.shift_id, kind })
}

function plus() {
  if (busy) return
  onOp({ type: "addPlace", shiftId: shift.shift_id, kind })
}
</script>

<div class="flex items-center justify-between gap-2 text-xs print:hidden">
  <span class="text-foreground-muted">
    {KIND_LABEL[kind]}: {total}
    <span class="sr-only">plasser</span>
  </span>
  <span class="flex gap-1">
    <button
      type="button"
      data-minus={`${shift.shift_id}-${kind}`}
      aria-disabled={busy || empty === 0 ? "true" : undefined}
      aria-label={`Færre ${label}, ${where}`}
      class={cn(button)}
      onclick={minus}
    >
      <span aria-hidden="true">−</span>
    </button>
    <button
      type="button"
      data-plus={`${shift.shift_id}-${kind}`}
      aria-disabled={busy ? "true" : undefined}
      aria-label={`Flere ${label}, ${where}`}
      class={cn(button)}
      onclick={plus}
    >
      <span aria-hidden="true">+</span>
    </button>
  </span>
</div>
