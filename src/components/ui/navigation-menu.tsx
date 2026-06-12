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
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      className={cn(
        "group relative flex cursor-pointer items-center gap-1 border-2 border-transparent px-3 py-2.5 font-heading text-foreground",
        "hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm",
        "data-popup-open:border-border data-popup-open:bg-primary data-popup-open:text-primary-foreground data-popup-open:shadow-hard-sm",
        "focus-brutal",
        className,
      )}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Icon>
        <ChevronDown
          aria-hidden
          className="size-[1em] shrink-0 text-current group-data-popup-open:rotate-180"
          strokeWidth={1.75}
        />
      </NavigationMenuPrimitive.Icon>
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
