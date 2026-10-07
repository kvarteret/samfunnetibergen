"use client"

import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

function NavigationMenu({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Root.Props) {
  return (
    <NavigationMenuPrimitive.Root
      className={cn(
        "relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Portal>
        <NavigationMenuPrimitive.Positioner
          align="start"
          className="z-50 outline-none"
          collisionPadding={12}
          sideOffset={6}
        >
          <NavigationMenuPrimitive.Popup className="relative rounded-xl border border-border bg-card shadow-[0_16px_36px_-14px_rgb(0_0_0/0.28)] outline-none transition-[opacity,transform] duration-150 data-ending-style:-translate-y-1 data-ending-style:opacity-0 data-starting-style:-translate-y-1 data-starting-style:opacity-0">
            <NavigationMenuPrimitive.Viewport className="relative h-[var(--popup-height)] w-[var(--popup-width)] overflow-hidden" />
          </NavigationMenuPrimitive.Popup>
        </NavigationMenuPrimitive.Positioner>
      </NavigationMenuPrimitive.Portal>
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: NavigationMenuPrimitive.List.Props) {
  return (
    <NavigationMenuPrimitive.List
      className={cn(
        "flex flex-1 list-none items-center justify-center",
        className,
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: NavigationMenuPrimitive.Item.Props) {
  return (
    <NavigationMenuPrimitive.Item
      className={cn("relative", className)}
      {...props}
    />
  )
}

function NavigationMenuTrigger({
  className,
  children,
  hideArrow,
  render,
  ...props
}: NavigationMenuPrimitive.Trigger.Props & { hideArrow?: boolean }) {
  return (
    <NavigationMenuPrimitive.Trigger
      className={cn(
        "group relative flex cursor-pointer items-center gap-1 border-2 border-transparent px-3 py-2.5 font-heading text-foreground",
        "hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm",
        "data-popup-open:border-border data-popup-open:bg-primary data-popup-open:text-primary-foreground data-popup-open:shadow-hard-sm",
        // HS: a thin bar on hover/open, where the active bar sits, instead of a filled box.
        "hs:hover:border-transparent hs:hover:bg-transparent hs:hover:text-foreground hs:hover:shadow-none hs:hover:after:absolute hs:hover:after:inset-x-3 hs:hover:after:bottom-0 hs:hover:after:h-0.5 hs:hover:after:bg-foreground/25",
        "hs:data-popup-open:border-transparent hs:data-popup-open:bg-transparent hs:data-popup-open:text-foreground hs:data-popup-open:shadow-none hs:data-popup-open:after:absolute hs:data-popup-open:after:inset-x-3 hs:data-popup-open:after:bottom-0 hs:data-popup-open:after:h-0.5 hs:data-popup-open:after:bg-foreground/25",
        "focus-brutal",
        className,
      )}
      nativeButton={render == null}
      render={render}
      {...props}
    >
      {children}
      {!hideArrow && (
        <NavigationMenuPrimitive.Icon>
          <ChevronDown
            aria-hidden
            className="size-[1em] shrink-0 text-current group-data-popup-open:rotate-180"
            strokeWidth={1.75}
          />
        </NavigationMenuPrimitive.Icon>
      )}
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      className={cn("h-full w-max", className)}
      {...props}
    />
  )
}

type NavigationMenuLinkProps = NavigationMenuPrimitive.Link.Props & {
  variant?: "menu" | "top"
}

function NavigationMenuLink({
  className,
  variant = "menu",
  ...props
}: NavigationMenuLinkProps) {
  return (
    <NavigationMenuPrimitive.Link
      className={cn(
        "cursor-pointer text-foreground focus-brutal",
        // Dropdown rows: rounded, with a soft tint on hover.
        variant === "menu" &&
          "block rounded-lg px-3 py-2 transition-colors hover:bg-muted data-highlighted:bg-muted",
        variant === "top" &&
          "relative flex items-center border-2 border-transparent px-3 py-2.5 font-heading hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm",
        // HS: top-level links show a thin bar on hover instead of a filled box.
        variant === "top" &&
          "hs:hover:border-transparent hs:hover:bg-transparent hs:hover:text-foreground hs:hover:shadow-none hs:hover:after:absolute hs:hover:after:inset-x-3 hs:hover:after:bottom-0 hs:hover:after:h-0.5 hs:hover:after:bg-foreground/25",
        className,
      )}
      closeOnClick
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
}
