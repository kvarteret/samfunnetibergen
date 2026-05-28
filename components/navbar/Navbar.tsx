import Link from "next/link"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import type { NavbarContent, NavGroup, NavItem, NavLeaf } from "@/lib/sanity/fetch"
import { MobileMenu } from "./MobileMenu"

type NavbarProps = {
    navbar: NavbarContent | null
}

function resolveHref(item: { href?: string | null; externalUrl?: string | null }) {
    return item.href ?? item.externalUrl ?? "#"
}

function isExternal(item: { href?: string | null; externalUrl?: string | null }) {
    return !item.href && Boolean(item.externalUrl)
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar({ navbar }: NavbarProps) {
    const items = navbar?.items ?? []

    return (
        <header className="sticky top-0 z-30 border-b-2 border-border bg-background">
            <nav
                aria-label="Hovednavigasjon"
                className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-14"
            >
                <Link
                    className="py-3.5 font-heading text-base font-medium tracking-tight text-foreground transition-opacity hover:opacity-75 lg:text-lg"
                    href="/"
                >
                    Samfunnet i Bergen
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
        <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-7">
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
        <div className="min-w-[14rem] p-3">
            {groups.map((group, gi) => (
                <div className="space-y-0.5" key={group._key ?? gi}>
                    {group.groupLabel && (
                        <p className="px-2 py-1.5 font-heading text-[10px] uppercase tracking-widest text-foreground/40">
                            {group.groupLabel}
                        </p>
                    )}
                    {group.items?.map((leaf: NavLeaf, li) => {
                        const leafHref = resolveHref(leaf)
                        const leafExternal = isExternal(leaf)
                        return (
                            <NavigationMenuLink asChild key={leaf._key ?? `${gi}-${li}`}>
                                {leafExternal ? (
                                    <a href={leafHref} rel="noreferrer" target="_blank">
                                        {leaf.label}
                                    </a>
                                ) : (
                                    <Link href={leafHref}>{leaf.label}</Link>
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
        "relative px-0.5 py-1 font-heading text-sm text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-foreground after:transition-all after:duration-200 hover:after:w-full"

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
