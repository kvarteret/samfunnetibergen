import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * The site's call to action ("Kjøp billett", "Bli frivillig"): a red pill in
 * the heading face that lifts slightly on hover. Shared with nav links that
 * cannot render a <Button>.
 */
const pillMotion =
  "rounded-full px-5 font-heading transition-[translate,box-shadow,filter,background-color] duration-150 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:brightness-100"

const ctaClassName = `${pillMotion} bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(0_0_0/0.12)] hover:shadow-[0_6px_16px_-6px_rgb(0_0_0/0.35)] hover:brightness-105`

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-base  font-base gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-brutal disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: ctaClassName,
        // Secondary pill: outlined, same shape and motion as the CTA.
        neutral: `${pillMotion} border-2 border-border bg-background text-foreground hover:border-foreground/40 hover:shadow-[0_6px_16px_-8px_rgb(0_0_0/0.25)]`,
        // Red fill with a contrasting light border — for use on red surfaces
        // (e.g. the HS footer) where the default border would disappear.
        inverse: `${ctaClassName} border-2 border-background`,
        // No border/shadow — for embedded UI like calendar day cells
        plain: "bg-transparent text-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  render,
  ...props
}: Omit<ButtonPrimitive.Props, "className"> &
  VariantProps<typeof buttonVariants> & {
    className?: string
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={!render}
      render={render}
      {...props}
    />
  )
}

export { Button, buttonVariants, ctaClassName }
