---
name: kvarteret-jubileum-react-style
description: Apply a direct, page-local React coding style for TSX components, shadcn-style UI primitives, Tailwind-heavy interfaces, section-based component trees, decorative client components, and reusable card or button surfaces that should read clearly from top to bottom.
---

# React Coding Style

Use this skill to write React that is direct, page-local, Tailwind-forward, and easy to understand by scrolling from the top of a TSX file to the bottom. The reference style favors clear local structure over premature abstraction: keep domain-specific UI close to where it is used, make parent components read like the visible page, and extract only when the extracted name explains a real UI section or reusable primitive.

This is a coding-practices skill. Do not encode project facts, routing details, framework-specific page conventions, content rules, or one-off domain behavior here. Adapt the patterns to the current app and let the local codebase provide the actual product vocabulary.

## File Shape

- Start with imports, then local types, then the main exported component, then local child components in render order.
- Keep feature-specific child components in the same file when they are only used by that page, card, or parent component.
- Put shared primitives in the app's existing UI primitive directory and keep them generic.
- Prefer a small number of purposeful files over splitting every section into its own module.
- Keep data preparation above the component that renders it, not mixed into JSX.
- Avoid compatibility aliases, pass-through wrappers, and indirection layers that do not make the current file easier to read.
- Leave imports boring: external packages first, local primitives next, then utilities/assets/data.

## Top-To-Bottom Reading Order

Arrange React files so the reader meets concepts in this order:

1. Imports.
2. Domain data types and prop interfaces.
3. Small data transforms used by the exported component.
4. Main exported component when it explains the feature at a glance.
5. Local child components in visible render order.
6. Small leaf helpers used only by those children.

Do not make readers jump between files or scan upward to understand basic flow. If the parent component renders `CardHeader`, `CardBody`, and `CardActions`, define those children in that same order below the parent.

## Component Breakdown

- Split by visible UI sections, not by technical category.
- Name local components after the section they render: `EventHeader`, `EventCollaboration`, `EventLinks`, `HeroActions`, `MemberGroups`.
- Put each component's props interface immediately before that component unless the props type is shared across several local children.
- Keep parent components declarative: the parent should show the page, card, or panel structure; local children own details.
- Keep conditional UI next to the element it controls.
- Prefer early `return null` for optional browser-only or decorative components once setup is done.
- Extract a child only when the extracted component has a stable visible responsibility, not just to shorten JSX.
- Avoid generic local component names like `Section`, `Wrapper`, `Content`, or `Item` when a domain name is available.

Example: a card parent should read as the card's visible structure, with local child components handling details.

```tsx
interface EventCardProps {
  event: Event
  className?: string
}

export const EventCard = ({ event, className }: EventCardProps) => {
  return (
    <Card className={cn("h-full w-full rounded-sm", className)}>
      <EventHeader title={event.title} time={event.time} location={event.location} />
      <EventCollaboration collaborator={event.collaborator} />
      <EventLinks ticketUrl={event.ticketUrl} facebookUrl={event.facebookUrl} price={event.price} />
    </Card>
  )
}

interface EventHeaderProps {
  title: string
  time?: string
  location?: string
}

const EventHeader = ({ title, time, location }: EventHeaderProps) => (
  <CardHeader className="space-y-4">
    <div className="flex flex-col">
      <CardTitle className="mr-8 flex text-xl font-bold uppercase leading-tight tracking-wide">
        {title}
      </CardTitle>
      <div className="flex flex-col">
        {location && <span className="uppercase">{location}</span>}
        {time && <p className="text-sm text-muted-foreground">{time}</p>}
      </div>
    </div>
  </CardHeader>
)
```

## Props And Types

- Use explicit `interface` props for exported components and meaningful local child components.
- Keep props narrow and view-oriented. Pass `title`, `time`, and `location` to `EventHeader`, not an entire `event` object, unless the child truly owns the full object.
- Derive types from imported data when that data is the real source of truth, for example `type Event = typeof events[number]`.
- Prefer optional props for optional UI and render conditionally in the component that owns the element.
- Use `ComponentPropsWithoutRef<"div">` or `React.HTMLAttributes<HTMLDivElement>` for wrapper primitives that pass through native attributes.
- For UI primitives, extend the native element attributes and add only the variant/control props the primitive owns.

Example: pass-through wrapper props should preserve native div behavior while adding a small, named API.

```tsx
import type { ComponentPropsWithoutRef, ReactNode } from "react"

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  reverse?: boolean
  pauseOnHover?: boolean
  vertical?: boolean
  repeat?: number
}

export default function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, index) => (
        <div
          key={index}
          className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
            "animate-marquee flex-row": !vertical,
            "animate-marquee-vertical flex-col": vertical,
            "group-hover:[animation-play-state:paused]": pauseOnHover,
            "[animation-direction:reverse]": reverse,
          })}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
```

## Data Flow

- Keep transforms pure and close to the page or component that consumes them unless reused elsewhere.
- Prefer named pipeline steps such as `onlyVisible`, `groupByDate`, and `sortByDate` over inline chained logic in markup.
- Use a pipeline helper only when it makes preparation read as a linear story.
- Do not hide simple checks behind helpers if the condition is more readable inline.
- Normalize sentinel or placeholder values once, then pass clean optional values into UI components.
- Keep rendering branches based on already-prepared booleans when several elements share the same condition.

Example: compute small booleans before rendering actions.

```tsx
interface EventLinksProps {
  ticketUrl?: string
  facebookUrl?: string
  price?: string
}

const EventLinks = ({ ticketUrl, facebookUrl, price }: EventLinksProps) => {
  const hasTickets = Boolean(ticketUrl && ticketUrl !== "COMING_SOON")
  const hasFacebook = Boolean(facebookUrl && facebookUrl !== "COMING_SOON")

  return (
    <CardFooter>
      <div className="grid w-full grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 md:gap-y-2">
        {hasFacebook && (
          <Button asChild variant="gold" className="w-full md:w-auto">
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
              View Event
            </a>
          </Button>
        )}
        {price && (
          <div className="flex items-center justify-self-end text-sm md:justify-self-center">
            <span className="font-medium">CC</span>
            <span className="ml-1">{price}</span>
          </div>
        )}
        {hasTickets && (
          <Button asChild variant="goldOutline" className="w-full md:justify-self-end">
            <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
              Buy Tickets
            </a>
          </Button>
        )}
      </div>
    </CardFooter>
  )
}
```

## Styling

- Use Tailwind classes directly in markup for page-specific layout and visual decisions.
- Use `cn()` for class composition, conditional classes, and caller overrides.
- Prefer readable, stable layout classes before decorative classes: size, display, grid/flex, spacing, color, typography, motion.
- Keep component-level visual decisions with the component that owns the markup.
- Put shared visual variants on primitives, not in scattered page-level conditionals.
- Use arbitrary Tailwind values when they express layout precisely and remain local to the component.
- Keep hover and transition effects small and purposeful; avoid making base primitives unexpectedly animated unless the variant clearly owns that behavior.
- Avoid custom CSS files for one-off component styling when Tailwind can express it clearly.

Example: conditional Tailwind should remain close to the element it affects.

```tsx
className={cn(
  "flex shrink-0 justify-around [gap:var(--gap)]",
  {
    "animate-marquee flex-row": !vertical,
    "animate-marquee-vertical flex-col": vertical,
    "group-hover:[animation-play-state:paused]": pauseOnHover,
    "[animation-direction:reverse]": reverse,
  },
)}
```

## Client Components And Effects

- Use client-side React for interactivity, browser-only effects, or componentized UI that needs state.
- Keep effect setup explicit and local. For one-time setup, use `useEffect(..., [])`.
- Memoize large static option objects with `useMemo`.
- Return `null` until browser-only setup is ready.
- Do not hide important behavior behind a generic hook unless multiple components actually share it.
- Remove demo logging and library starter comments when turning copied examples into app code.
- Prefer a single readiness state for third-party setup instead of scattering guard checks through JSX.

Example: browser-only setup should be explicit, isolated, and render nothing until ready.

```tsx
export const DecorativeParticles = () => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setReady(true)
    })
  }, [])

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      particles: {
        color: {
          value: "#D4AF37",
        },
        move: {
          enable: true,
          speed: 0.2,
        },
      },
      detectRetina: true,
    }),
    [],
  )

  if (!ready) {
    return null
  }

  return <Particles id="particles" options={options} className="absolute inset-0 -z-10" />
}
```

## UI Primitive Style

- Use `React.forwardRef` for shared primitives that wrap DOM elements.
- Define variant maps with `cva` for reusable styling surfaces.
- Export primitives and their variant helpers together when callers need both.
- Set `displayName` on `forwardRef` components.
- Keep primitive defaults minimal; page components should supply layout-specific classes.
- Use `Slot` and an `asChild` prop when a primitive needs to style links or other child elements without adding extra DOM.
- Keep variant names semantic to the design system, for example `default`, `outline`, `secondary`, `ghost`, `link`, or a domain-neutral brand variant.
- Avoid putting page-specific layout such as `w-full`, grid area names, or section margins into base primitive variants.

Example: a button primitive owns variants and sizes; callers own placement.

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        gold: "bg-primary-gold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-gold",
        goldOutline: "border-2 border-primary-gold text-primary-gold transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-gold/10 hover:text-primary-gold",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Example: card primitives should be thin wrappers with predictable slots.

```tsx
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-card text-card-foreground shadow", className)}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"
```

## Comments

- Avoid comments that narrate ordinary JSX or obvious prop passing.
- Keep comments only when they explain a non-obvious business rule, third-party constraint, accessibility tradeoff, or intentionally unusual layout.
- Delete copied starter comments from third-party examples once the code is adapted.
- Prefer expressive component names over section comments.

## Review Checklist

- Does the exported component show the visible structure at a glance?
- Are local child components defined in the same order they render?
- Are props narrow, typed, and placed next to their component?
- Are Tailwind classes local to the markup that owns the visual choice?
- Are shared primitives generic and free of page-specific layout?
- Are effects local, explicit, and free of leftover demo logs?
- Are optional UI branches close to the elements they control?
- Is every extraction justified by reuse or a visible section-level name?

## Avoid

- Large all-purpose components with many unrelated branches.
- Extracting a child component before it has a visible section-level purpose.
- Moving page-only helpers into shared utility files.
- Passing whole domain objects through several layers when children only need two or three fields.
- Generic names like `Section`, `Block`, `Wrapper`, or `Item` when a domain name is available.
- Deep prop drilling created only by over-splitting files.
- Hidden mutations, in-place array sorting, or data preparation with side effects.
- Framework-specific guidance in this skill; keep it about React and TypeScript component practices.
- Explanatory comments for ordinary JSX; let component names and order carry the explanation.
