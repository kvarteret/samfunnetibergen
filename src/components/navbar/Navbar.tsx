import { ExternalLink } from "lucide-react"
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
import { PaperMenuSection } from "./PaperPicker"

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
        {
          _key: "static-offentlige-dokumenter",
          label: "Offentlige dokumenter",
          href: null,
          externalUrl:
            "https://drive.google.com/drive/folders/0B0B-uQZgv7V3NHY0V0lXQUQ2elU?resourcekey=0-YYvE5cj9cKfVcTP4_p0w0Q",
        },
      ],
    },
  ],
}

const bookingItem: NavItem = {
  _key: "static-booking",
  label: "Booking",
  href: "/rom/book",
  externalUrl: null,
  children: [
    {
      _key: "static-booking-links",
      groupLabel: null,
      items: [
        {
          _key: "static-karaoke",
          label: "Karaoke",
          href: "/karaoke",
          externalUrl: null,
        },
      ],
    },
  ],
}

function withMoreMenu(items: NavItem[]) {
  const filtered = items.filter(
    item => item._key !== moreItem._key && item._key !== bookingItem._key,
  )
  return [bookingItem, ...filtered, moreItem]
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
          className="block py-2.5 transition-opacity hover:opacity-75 focus-brutal dan-logo-badge"
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
    <NavigationMenu className="hidden lg:flex" closeDelay={0} delay={0}>
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
        <NavigationMenuLink
          render={<NavLink external={external} href={href} />}
          variant="top"
        >
          {item.label}
        </NavigationMenuLink>
      </NavigationMenuItem>
    )
  }

  const isBooking = item._key === bookingItem._key

  return (
    <NavigationMenuItem value={item._key}>
      <NavigationMenuTrigger
        hideArrow={isBooking}
        render={
          isBooking ? <NavLink external={external} href={href} /> : undefined
        }
      >
        {item.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <DropdownGroups groups={item.children ?? []} />
        {item._key === moreItem._key && <PaperMenuSection />}
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
              <NavigationMenuLink
                key={leaf._key ?? `${gi}-${li}`}
                render={
                  leafExternal ? (
                    <a href={leafHref} rel="noreferrer" target="_blank" />
                  ) : (
                    <Link href={leafHref} />
                  )
                }
              >
                {leaf.label}
                {leafExternal && (
                  <ExternalLink
                    aria-hidden="true"
                    className="ml-1 inline size-3 shrink-0"
                  />
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
  className,
  ...props
}: {
  href: string
  external?: boolean
  children?: React.ReactNode
} & React.ComponentPropsWithRef<"a">) {
  return external ? (
    <a
      className={className}
      href={href}
      rel="noreferrer"
      target="_blank"
      {...props}
    >
      {children}
      <ExternalLink
        aria-hidden="true"
        className="ml-1 inline size-3 shrink-0"
      />
    </a>
  ) : (
    <Link className={className} href={href} {...props}>
      {children}
    </Link>
  )
}