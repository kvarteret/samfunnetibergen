import { cva } from "class-variance-authority"

export const selectionControlVariants = cva(
  "cursor-pointer rounded-base border-2 border-border bg-card text-foreground focus-brutal disabled:cursor-not-allowed disabled:opacity-45",
  {
    variants: {
      selected: {
        false: "hover:bg-muted",
        true: "",
      },
      appearance: {
        solid: "",
        soft: "",
      },
      size: {
        none: "",
        default: "min-h-11 px-3 py-1.5 font-heading ",
        square: "size-11 font-heading ",
        fill: "min-h-11 flex-1 px-3 py-2.5 font-heading  uppercase tracking-widest",
      },
    },
    compoundVariants: [
      {
        appearance: "solid",
        selected: true,
        className: "bg-primary text-primary-foreground",
      },
      {
        appearance: "soft",
        selected: true,
        className: "border-primary bg-primary/5 text-foreground",
      },
    ],
    defaultVariants: {
      appearance: "solid",
      size: "default",
    },
  },
)
