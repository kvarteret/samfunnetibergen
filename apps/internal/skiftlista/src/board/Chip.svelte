<!-- A count in the week bar that jumps to the first item it counts. -->
<script lang="ts">
import type { Snippet } from "svelte"
import { cn } from "../lib/cn"
import { selectionControlVariants } from "../lib/selection-control"

interface Props {
  title: string
  tone?: "red" | "yellow"
  onclick: () => void
  children: Snippet
}

let { title, tone, onclick, children }: Props = $props()
</script>

<button
  type="button"
  {title}
  class={cn(
    selectionControlVariants({ size: "none" }),
    "min-h-10 rounded-full px-4 font-heading",
    tone === "red" && "border-warn-red text-warn-red",
    tone === "yellow" && "border-warn-yellow text-warn-yellow",
  )}
  {onclick}
>
  {@render children()}
</button>
