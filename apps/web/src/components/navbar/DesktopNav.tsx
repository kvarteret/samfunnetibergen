"use client"

import { ExternalLink } from "lucide-react"
import { ctaClassName } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type {
  NavigationGroup,
  NavigationItem,
  NavigationLink,
} from "./navigation-items"
import { isNavigationItemActive } from "./navigation-items"
import { PaperMenuSection } from "./PaperPicker"

export function DesktopNav({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname()

  return (
    <NavigationMenu className="hidden lg:flex" closeDelay={0} delay={0}>
      <NavigationMenuList>
        {items.map(item => (
          <DesktopNavItem item={item} key={item.id} pathname={pathname} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function DesktopNavItem({
  item,
  pathname,
}: {
  item: NavigationItem
  pathname: string
}) {
  const hasDropdown = (item.children?.length ?? 0) > 0
  const active = isNavigationItemActive(item, pathname)
  const activeClass =
    "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-[#eb3b3b]"

  if (!hasDropdown) {
    return (
      <NavigationMenuItem value={item.id}>
        <NavigationMenuLink
          className={cn(
            active && activeClass,
            item.highlight &&
              cn(
                ctaClassName,
                "self-center border-transparent py-1.5 hover:border-transparent hover:bg-primary hover:text-primary-foreground hs:hover:bg-primary hs:hover:text-primary-foreground hs:hover:after:hidden",
              ),
          )}
          render={<NavItemLink active={active} item={item} />}
          variant="top"
        >
          {item.label}
        </NavigationMenuLink>
      </NavigationMenuItem>
    )
  }

  return (
    <NavigationMenuItem value={item.id}>
      <NavigationMenuTrigger
        hideArrow={item.hideDesktopArrow}
        render={
          item.href ? <NavItemLink active={active} item={item} /> : undefined
        }
        aria-current={item.href && active ? "page" : undefined}
        className={cn(active && activeClass)}
      >
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className={cn(item.includePaperMenu && "w-[34rem]")}>
          <DropdownGroups
            columns={item.includePaperMenu ? 2 : 1}
            groups={item.children ?? []}
          />
          {item.includePaperMenu && <PaperMenuSection />}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

function DropdownGroups({
  groups,
  columns = 1,
}: {
  groups: NavigationGroup[]
  columns?: 1 | 2
}) {
  return (
    <div className="min-w-48 space-y-2 p-1.5">
      {groups.map(group => (
        <div
          className={cn(
            columns === 2 ? "grid grid-cols-2 gap-0.5" : "space-y-0.5",
          )}
          key={group.id}
        >
          {group.label && (
            <p className="px-3 pt-1.5 pb-0.5 font-heading text-sm text-foreground-muted">
              {group.label}
            </p>
          )}
          {group.links.map(link => (
            <NavigationMenuLink
              key={link.id}
              render={<NavItemLink item={link} />}
            >
              {link.label}
            </NavigationMenuLink>
          ))}
        </div>
      ))}
    </div>
  )
}

function NavItemLink({
  item,
  active = false,
  children,
  ...props
}: {
  item: NavigationLink
  active?: boolean
  children?: React.ReactNode
} & React.ComponentPropsWithRef<"a">) {
  const href = item.href ?? "#"
  const ariaCurrent = active ? "page" : undefined

  if (item.kind === "external") {
    return (
      <a
        {...props}
        aria-current={ariaCurrent}
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {children}
        <ExternalLink
          aria-hidden="true"
          className="ml-1 inline size-3 shrink-0"
        />
      </a>
    )
  }

  if (item.kind === "plain") {
    return (
      <a {...props} aria-current={ariaCurrent} href={href}>
        {children}
      </a>
    )
  }

  return (
    <Link {...props} aria-current={ariaCurrent} href={href}>
      {children}
    </Link>
  )
}
