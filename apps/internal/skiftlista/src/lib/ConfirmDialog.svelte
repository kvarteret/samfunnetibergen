<!-- The big warning: a modal that must be answered before a person who lacks
     what the place needs is placed. Bits UI's AlertDialog (role
     "alertdialog") cannot be dismissed by a click outside; Escape and the
     Avbryt button cancel, and focus starts on Avbryt so Enter does not
     confirm by accident. -->
<script lang="ts">
import { AlertDialog } from "bits-ui"
import type { Note } from "../core/types"
import { levelOf } from "../core/view"
import { buttonVariants } from "./button"
import { cn } from "./cn"

interface Props {
  open: boolean
  title: string
  /** One sentence naming the person and the place. */
  subject: string
  warnings: Note[]
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

let {
  open,
  title,
  subject,
  warnings,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props = $props()

// Red warnings first; they are the reason for the popup.
let cancelButton = $state<HTMLElement | null>(null)

const ordered = $derived(
  [...warnings].sort(
    (a, b) => Number(b.level === "red") - Number(a.level === "red"),
  ),
)
</script>

<AlertDialog.Root
  {open}
  onOpenChange={next => {
    if (!next) onCancel()
  }}
>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="noprint fixed inset-0 z-[60] bg-foreground/50" />
    <AlertDialog.Content
      data-slot="confirm"
      onOpenAutoFocus={event => {
        event.preventDefault()
        cancelButton?.focus()
      }}
      class="noprint fixed top-1/2 left-1/2 z-[70] flex w-[min(30rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-base border-2 border-warn-red bg-panel p-5 shadow-shadow outline-none"
    >
      <AlertDialog.Title class="text-xl font-heading">{title}</AlertDialog.Title>
      <AlertDialog.Description class="text-sm">{subject}</AlertDialog.Description>
      <ul class="flex flex-col gap-1">
        {#each ordered as note (note.text)}
          <li
            class={cn(
              "rounded-base border-l-4 bg-card px-3 py-1.5 text-sm font-heading",
              note.level === "red"
                ? "border-warn-red text-warn-red"
                : "border-warn-yellow text-warn-yellow",
            )}
          >
            <span class="sr-only">
              {note.level === "red" ? "Alvorlig:" : "Advarsel:"}
            </span>
            {note.text}
          </li>
        {/each}
      </ul>
      {#if levelOf(ordered) === null}
        <p class="text-sm">Ingen advarsler.</p>
      {/if}
      <div class="mt-2 flex flex-wrap justify-end gap-2">
        <AlertDialog.Cancel
          bind:ref={cancelButton}
          class={buttonVariants({ variant: "neutral" })}
        >
          Avbryt
        </AlertDialog.Cancel>
        <AlertDialog.Action
          class={cn(buttonVariants(), "bg-cta")}
          onclick={onConfirm}
        >
          {confirmLabel}
        </AlertDialog.Action>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
