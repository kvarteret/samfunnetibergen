"use client"

import { ExternalLink } from "lucide-react"
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
import { isNavigationItemActive } from "./navigation-items"
import type {
  NavigationGroup,
  NavigationItem,
  NavigationLink,
} from "./navigation-items"
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
              "border-primary bg-primary px-4 text-primary-foreground shadow-hard-sm hover:border-primary hover:bg-primary hover:text-primary-foreground hs:hover:bg-primary hs:hover:text-primary-foreground hs:hover:no-underline",
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
        <DropdownGroups groups={item.children ?? []} />
        {item.includePaperMenu && <PaperMenuSection />}
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

function DropdownGroups({ groups }: { groups: NavigationGroup[] }) {
  return (
    <div className="min-w-56 p-3">
      {groups.map(group => (
        <div className="space-y-0.5" key={group.id}>
          {group.label && (
            <p className="px-2 py-1.5 font-heading uppercase tracking-widest text-foreground-muted">
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
