"use client"

import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu"
import { ChevronDown } from "lucide-react"
import type * as React from "react"

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
          align="end"
          className="z-50 outline-none"
          collisionPadding={12}
          sideOffset={12}
        >
          <NavigationMenuPrimitive.Popup className="relative border-2 border-border bg-card shadow-shadow outline-none">
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
        // HS: underline on hover/open instead of a filled box.
        "hs:hover:border-transparent hs:hover:bg-transparent hs:hover:text-foreground hs:hover:underline hs:hover:underline-offset-4 hs:hover:shadow-none",
        "hs:data-popup-open:border-transparent hs:data-popup-open:bg-transparent hs:data-popup-open:text-foreground hs:data-popup-open:underline hs:data-popup-open:underline-offset-4 hs:data-popup-open:shadow-none",
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
        "cursor-pointer border-2 border-transparent text-foreground focus-brutal",
        variant === "menu" && "block px-2 py-1.5",
        variant === "top" &&
          "relative flex items-center px-3 py-2.5 font-heading",
        "hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm",
        // HS: top-level links underline on hover instead of a filled box.
        variant === "top" &&
          "hs:hover:border-transparent hs:hover:bg-transparent hs:hover:text-foreground hs:hover:underline hs:hover:underline-offset-4 hs:hover:shadow-none",
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
