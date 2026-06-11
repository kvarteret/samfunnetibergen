import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full border-2 border-border bg-card selection:bg-main selection:text-main-foreground px-3 py-2  font-base text-foreground file:border-0 file:bg-transparent file: file:font-heading placeholder:text-foreground-muted focus-brutal disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
