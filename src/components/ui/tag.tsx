import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex w-fit items-center border-2 px-2 py-0.5 font-heading text-base uppercase tracking-widest",
  {
    variants: {
      variant: {
        neutral: "border-border bg-card text-foreground",
        success: "border-border bg-success text-success-foreground",
        warning: "border-border bg-primary text-primary-foreground",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground",
        outline: "border-border bg-transparent text-foreground-muted",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)

export interface TagProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof tagVariants> {}

export function Tag({ className, variant, ...props }: TagProps) {
  return <span className={cn(tagVariants({ variant }), className)} {...props} />
}
