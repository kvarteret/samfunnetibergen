import { ExternalLink } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type {
  NavigationGroup,
  NavigationItem,
  NavigationLink,
} from "./navigation-items"
import { PaperMenuSection } from "./PaperPicker"

export function DesktopNav({ items }: { items: NavigationItem[] }) {
  return (
    <NavigationMenu className="hidden lg:flex" closeDelay={0} delay={0}>
      <NavigationMenuList>
        {items.map(item => (
          <DesktopNavItem item={item} key={item.id} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function DesktopNavItem({ item }: { item: NavigationItem }) {
  const hasDropdown = (item.children?.length ?? 0) > 0

  if (!hasDropdown) {
    return (
      <NavigationMenuItem value={item.id}>
        <NavigationMenuLink
          className={cn(
            item.highlight &&
              "border-primary bg-primary px-4 text-primary-foreground shadow-hard-sm hover:border-primary hover:bg-primary hover:text-primary-foreground hs:hover:bg-primary hs:hover:text-primary-foreground hs:hover:no-underline",
          )}
          render={<NavItemLink item={item} />}
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
        render={item.href ? <NavItemLink item={item} /> : undefined}
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
  children,
  ...props
}: {
  item: NavigationLink
  children?: React.ReactNode
} & React.ComponentPropsWithRef<"a">) {
  const href = item.href ?? "#"

  if (item.kind === "external") {
    return (
      <a {...props} href={href} rel="noreferrer" target="_blank">
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
      <a {...props} href={href}>
        {children}
      </a>
    )
  }

  return (
    <Link {...props} href={href}>
      {children}
    </Link>
  )
}
