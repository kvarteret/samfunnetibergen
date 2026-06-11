import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative grid w-full grid-alert-empty items-start gap-y-0.5 border-2 px-4 py-3 text-sm shadow-shadow has-[>svg]:grid-alert-icon has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        info: "border-border bg-card text-foreground",
        success: "border-success bg-success text-success-foreground",
        destructive: "border-destructive bg-destructive/10 text-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  const resolvedRole =
    props.role ?? (variant === "destructive" ? "alert" : "status")

  return (
    <div
      data-slot="alert"
      role={resolvedRole}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 min-h-4 font-heading", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm font-base [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
