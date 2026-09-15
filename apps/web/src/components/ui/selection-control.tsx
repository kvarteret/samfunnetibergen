import { cva } from "class-variance-authority"

export const selectionControlVariants = cva(
  "cursor-pointer rounded-base border border-border bg-card text-foreground focus-brutal disabled:cursor-not-allowed disabled:opacity-45",
  {
    variants: {
      selected: {
        false: "",
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
