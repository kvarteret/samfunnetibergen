import Image from "next/image"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import type {
  NavbarContent,
  NavGroup,
  NavItem,
  NavLeaf,
} from "@/lib/sanity/fetch"
import { MobileMenu } from "./MobileMenu"

type NavbarProps = {
  navbar: NavbarContent | null
}

const moreItem: NavItem = {
  _key: "static-more",
  label: "Mer",
  href: null,
  externalUrl: null,
  children: [
    {
      _key: "static-more-links",
      groupLabel: null,
      items: [
        {
          _key: "static-sponsors",
          label: "Sponsorer",
          href: "/sponsorer",
          externalUrl: null,
        },
        {
          _key: "static-link-in-bio",
          label: "Link i bio",
          href: "/linkibio",
          externalUrl: null,
        },
      ],
    },
  ],
}

function withMoreMenu(items: NavItem[]) {
  return [...items.filter(item => item._key !== moreItem._key), moreItem]
}

function resolveHref(item: {
  href?: string | null
  externalUrl?: string | null
}) {
  return item.href ?? item.externalUrl ?? "#"
}

function isExternal(item: {
  href?: string | null
  externalUrl?: string | null
}) {
  return !item.href && Boolean(item.externalUrl)
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar({ navbar }: NavbarProps) {
  const items = withMoreMenu(navbar?.items ?? [])

  return (
    <header className="sticky top-0 z-30 border-b-2 border-border bg-background">
      <nav
        aria-label="Hovednavigasjon"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-14"
      >
        <Link
          aria-label="Samfunnet i Bergen"
          className="block py-2.5 transition-opacity hover:opacity-75 focus-brutal"
          href="/"
        >
          <Image
            alt="Samfunnet i Bergen logo"
            className="h-8 w-auto sm:h-10"
            height={62}
            priority
            src="/kvarteret-logo.svg"
            width={100}
          />
        </Link>

        <DesktopNav items={items} />

        <MobileMenu items={items} />
      </nav>
    </header>
  )
}

// ─── DesktopNav ───────────────────────────────────────────────────────────────

function DesktopNav({ items }: { items: NavItem[] }) {
  return (
    <NavigationMenu
      className="hidden lg:flex"
      delayDuration={0}
      skipDelayDuration={0}
      viewport={false}
    >
      <NavigationMenuList>
        {items.map(item => (
          <DesktopNavItem item={item} key={item._key} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

// ─── DesktopNavItem ───────────────────────────────────────────────────────────

function DesktopNavItem({ item }: { item: NavItem }) {
  const hasDropdown = (item.children?.length ?? 0) > 0
  const href = resolveHref(item)
  const external = isExternal(item)

  if (!hasDropdown) {
    return (
      <NavigationMenuItem value={item._key}>
        <NavigationMenuLink asChild>
          <NavLink external={external} href={href}>
            {item.label}
          </NavLink>
        </NavigationMenuLink>
      </NavigationMenuItem>
    )
  }

  return (
    <NavigationMenuItem value={item._key}>
      <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <DropdownGroups groups={item.children ?? []} />
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

// ─── DropdownGroups ───────────────────────────────────────────────────────────

function DropdownGroups({ groups }: { groups: NavGroup[] }) {
  return (
    <div className="min-w-56 p-3">
      {groups.map((group, gi) => (
        <div className="space-y-0.5" key={group._key ?? gi}>
          {group.groupLabel && (
            <p className="px-2 py-1.5 font-heading uppercase tracking-widest text-foreground-muted">
              {group.groupLabel}
            </p>
          )}
          {group.items?.map((leaf: NavLeaf, li) => {
            const leafHref = resolveHref(leaf)
            const leafExternal = isExternal(leaf)
            return (
              <NavigationMenuLink asChild key={leaf._key ?? `${gi}-${li}`}>
                {leafExternal ? (
                  <a
                    className="focus-brutal"
                    href={leafHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {leaf.label}
                  </a>
                ) : (
                  <Link className="focus-brutal" href={leafHref}>
                    {leaf.label}
                  </Link>
                )}
              </NavigationMenuLink>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  external,
  children,
  ...props
}: {
  href: string
  external?: boolean
  children: React.ReactNode
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const cls =
    "relative flex cursor-pointer items-center border-2 border-transparent px-3 py-2.5 font-heading text-sm text-foreground hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm focus-brutal"

  return external ? (
    <a className={cls} href={href} rel="noreferrer" target="_blank" {...props}>
      {children}
    </a>
  ) : (
    <Link className={cls} href={href} {...props}>
      {children}
    </Link>
  )
}
