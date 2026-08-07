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
import type { HouseHoursContent } from "@/lib/sanity/fetch"
import type { NavGroup, NavItem, NavLeaf } from "@/lib/sanity/fetch"
import { cn } from "@/lib/utils"
import { MobileMenu } from "./MobileMenu"
import { NavbarScrollShell } from "./NavbarScrollShell"
import { NavbarOpenStatus } from "./NavbarOpenStatus"
import { PaperMenuSection } from "./PaperPicker"

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
          _key: "static-contact",
          label: "Kontakt",
          href: "/kontakt",
          externalUrl: null,
        },
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
  href: "/rom",
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

const volunteerItem: NavItem = {
  _key: "static-volunteer",
  label: "Bli frivillig",
  href: "/bli-frivillig",
  externalUrl: null,
  children: [],
}

const arrangementerItem: NavItem = {
  _key: "static-arrangementer",
  label: "Arrangementer",
  href: "/arrangementer",
  externalUrl: null,
  children: [],
}

const usefulInfoItem: NavItem = {
  _key: "static-useful-info",
  label: "Nyttig info",
  href: "/nyttig",
  externalUrl: null,
  children: [],
}

function orderedNavItems() {
  return [
    volunteerItem,
    arrangementerItem,
    bookingItem,
    usefulInfoItem,
    moreItem,
  ]
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

export function Navbar({
  houseHours,
}: {
  houseHours?: HouseHoursContent | null
}) {
  const items = orderedNavItems()

  return (
    <NavbarScrollShell>
      <nav
        aria-label="Hovednavigasjon"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 transition-[padding] duration-300 ease-out sm:px-10 lg:px-14"
      >
        <div className="flex min-w-0 items-center gap-4">
          <Link
            aria-label="Samfunnet i Bergen"
            className="block py-4 transition-[padding,opacity] duration-300 ease-out hover:opacity-75 focus-brutal group-data-[scrolled=true]/nav:py-2.5"
            href="/"
          >
            <Image
              alt="Samfunnet i Bergen logo"
              className="h-12 w-auto transition-[height] duration-300 ease-out group-data-[scrolled=true]/nav:h-8 sm:h-[3.75rem] sm:group-data-[scrolled=true]/nav:h-10"
              height={62}
              priority
              src="/kvarteret-logo.svg"
              width={100}
            />
          </Link>

          <NavbarOpenStatus
            closedDates={houseHours?.houseClosedDates}
            openingHours={houseHours?.operationsManagerHours}
            vacationMode={houseHours?.vacationMode}
          />
        </div>

        <DesktopNav items={items} />

        <MobileMenu items={items} />
      </nav>
    </NavbarScrollShell>
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
  const isVolunteer = item._key === volunteerItem._key

  if (!hasDropdown) {
    return (
      <NavigationMenuItem value={item._key}>
        <NavigationMenuLink
          className={cn(
            isVolunteer &&
              "border-primary bg-primary px-4 text-primary-foreground shadow-hard-sm hover:border-primary hover:bg-primary hover:text-primary-foreground hs:hover:bg-primary hs:hover:text-primary-foreground hs:hover:no-underline",
          )}
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
