import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full border-2 border-border bg-card selection:bg-main selection:text-main-foreground px-3 py-2 text-sm font-base text-foreground placeholder:text-foreground-faint focus-brutal disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
