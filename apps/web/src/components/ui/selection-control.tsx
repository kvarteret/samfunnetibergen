import { cva } from "class-variance-authority"

export const selectionControlVariants = cva(
  "cursor-pointer rounded-base border border-border bg-card text-foreground transition-colors active:translate-y-px focus-brutal disabled:cursor-not-allowed disabled:opacity-45",
  {
    variants: {
      selected: {
        false: "hover:bg-muted",
        true: "hover:brightness-[0.98]",
      },
      appearance: {
        solid: "",
        soft: "",
      },
      size: {
        none: "",
        default:
          "inline-flex min-h-11 items-center justify-center px-3 py-1.5 font-heading",
        square: "inline-flex size-11 items-center justify-center font-heading",
        fill: "inline-flex min-h-11 flex-1 items-center justify-center px-3 py-2.5 font-heading uppercase tracking-widest",
      },
    },
    compoundVariants: [
      {
        appearance: "solid",
        selected: true,
        className:
          "bg-primary text-primary-foreground hs:bg-secondary hs:text-secondary-foreground",
      },
      {
        appearance: "soft",
        selected: true,
        className:
          "border-primary bg-primary/5 text-foreground hs:border-secondary hs:bg-secondary-50",
      },
    ],
    defaultVariants: {
      appearance: "solid",
      size: "default",
    },
  },
)
