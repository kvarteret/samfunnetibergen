<!-- A bottom sheet restyled with the hs tokens (shadcn-svelte's sheet-content
     keeps four sides; only the bottom one is used here). Bits UI traps focus,
     closes on Escape and on a click outside, and hides the page behind it from
     screen readers while it is open. -->
<script lang="ts">
import { Dialog } from "bits-ui"
import type { Snippet } from "svelte"

interface Props {
  /** id of the heading inside the content that names the sheet */
  labelledby: string
  children: Snippet
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: (event: Event) => void
}

let { labelledby, children, onOpenAutoFocus, onCloseAutoFocus }: Props =
  $props()
</script>

<Dialog.Portal>
  <Dialog.Overlay
    class="noprint fixed inset-0 z-40 bg-foreground/40"
  />
  <Dialog.Content
    data-slot="sheet"
    aria-labelledby={labelledby}
    {onOpenAutoFocus}
    {onCloseAutoFocus}
    class="noprint fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-base border-t-2 border-secondary bg-panel p-4 shadow-shadow outline-none"
  >
    {@render children()}
  </Dialog.Content>
</Dialog.Portal>
