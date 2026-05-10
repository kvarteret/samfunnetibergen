import Link from "next/link"
import type { NavbarContent, NavGroup, NavItem, NavLeaf } from "@/lib/sanity/types"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { MobileMenu } from "./MobileMenu"

type NavbarProps = {
    navbar: NavbarContent | null
}

const FALLBACK_ITEMS = [
    { label: "Arrangementer", href: "/arrangementer" },
    { label: "Rom", href: "/rom" },
    { label: "Grupper", href: "/grupper" },
    { label: "Bli frivillig", href: "/blifrivillig" },
    { label: "Kontakt", href: "/kontakt" },
]

function resolveHref(item: { href?: string | null; externalUrl?: string | null }) {
    return item.href ?? item.externalUrl ?? "#"
}

function isExternal(item: { href?: string | null; externalUrl?: string | null }) {
    return !item.href && Boolean(item.externalUrl)
}

// ─── SimpleNavLink ────────────────────────────────────────────────────────────

function SimpleNavLink({
    href,
    external,
    children,
}: {
    href: string
    external?: boolean
    children: React.ReactNode
}) {
    const cls =
        "relative px-0.5 py-1 font-heading text-sm text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-foreground after:transition-all after:duration-200 hover:after:w-full"

    return external ? (
        <a className={cls} href={href} rel="noreferrer" target="_blank">
            {children}
        </a>
    ) : (
        <Link className={cls} href={href}>
            {children}
        </Link>
    )
}

// ─── DesktopNav ───────────────────────────────────────────────────────────────

function DesktopNavItem({ item }: { item: NavItem }) {
    const hasDropdown = (item.children?.length ?? 0) > 0
    const href = resolveHref(item)
    const external = isExternal(item)

    if (!hasDropdown) {
        return (
            <NavigationMenuItem>
                <SimpleNavLink external={external} href={href}>
                    {item.label}
                </SimpleNavLink>
            </NavigationMenuItem>
        )
    }

    return (
        <NavigationMenuItem>
            <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
            <NavigationMenuContent>
                <div className="min-w-[14rem] p-3">
                    {item.children?.map((group: NavGroup) => (
                        <div className="space-y-0.5" key={group._key}>
                            {group.groupLabel && (
                                <p className="px-2 py-1.5 font-heading text-[10px] uppercase tracking-widest text-foreground/40">
                                    {group.groupLabel}
                                </p>
                            )}
                            {group.items?.map((leaf: NavLeaf) => {
                                const leafHref = resolveHref(leaf)
                                const leafExternal = isExternal(leaf)
                                return (
                                    <NavigationMenuLink asChild key={leaf._key}>
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
            </NavigationMenuContent>
        </NavigationMenuItem>
    )
}

function DesktopNav({ items }: { items: NavItem[] }) {
    return (
        <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-7">
                {items.length > 0
                    ? items.map(item => <DesktopNavItem item={item} key={item._key} />)
                    : FALLBACK_ITEMS.map(item => (
                          <NavigationMenuItem key={item.href}>
                              <SimpleNavLink href={item.href}>{item.label}</SimpleNavLink>
                          </NavigationMenuItem>
                      ))}
            </NavigationMenuList>
        </NavigationMenu>
    )
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

                <MobileMenu fallbackItems={FALLBACK_ITEMS} items={items} />
            </nav>
        </header>
    )
}
