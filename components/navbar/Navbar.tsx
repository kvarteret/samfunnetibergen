import { ChevronDown } from "lucide-react"
import Link from "next/link"
import type { NavbarContent, NavGroup, NavItem, NavLeaf } from "@/lib/sanity/types"
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

function NavLink({
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

function TopLevelItem({ item }: { item: NavItem }) {
    const hasDropdown = (item.children?.length ?? 0) > 0
    const href = resolveHref(item)
    const external = isExternal(item)

    if (!hasDropdown) {
        return (
            <li>
                <NavLink external={external} href={href}>
                    {item.label}
                </NavLink>
            </li>
        )
    }

    return (
        <li className="group relative">
            <button
                className="relative flex items-center gap-1 px-0.5 py-1 font-heading text-sm text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-foreground after:transition-all after:duration-200 hover:after:w-full"
                type="button"
            >
                {item.label}
                <ChevronDown
                    aria-hidden
                    className="size-3.5 shrink-0 transition-transform duration-200 group-hover:rotate-180"
                />
            </button>

            {/* Dropdown */}
            <div className="invisible absolute left-0 top-[calc(100%+12px)] z-50 min-w-[14rem] border-2 border-border bg-background opacity-0 shadow-shadow transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <div className="p-3">
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
                                return leafExternal ? (
                                    <a
                                        className="block px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                                        href={leafHref}
                                        key={leaf._key}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        {leaf.label}
                                    </a>
                                ) : (
                                    <Link
                                        className="block px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                                        href={leafHref}
                                        key={leaf._key}
                                    >
                                        {leaf.label}
                                    </Link>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </li>
    )
}

export function Navbar({ navbar }: NavbarProps) {
    const items = navbar?.items ?? []

    return (
        <header className="sticky top-0 z-30 border-b-2 border-border bg-background">
            <nav
                aria-label="Hovednavigasjon"
                className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-14"
            >
                {/* Wordmark */}
                <Link
                    className="py-3.5 font-heading text-base font-medium tracking-tight text-foreground transition-opacity hover:opacity-75 lg:text-lg"
                    href="/"
                >
                    Samfunnet i Bergen
                </Link>

                {/* Desktop nav */}
                <ul className="hidden items-center gap-7 lg:flex">
                    {items.length > 0
                        ? items.map((item: NavItem) => <TopLevelItem item={item} key={item._key} />)
                        : FALLBACK_ITEMS.map(item => (
                              <li key={item.href}>
                                  <NavLink href={item.href}>{item.label}</NavLink>
                              </li>
                          ))}
                </ul>

                {/* Mobile toggle */}
                <MobileMenu fallbackItems={FALLBACK_ITEMS} items={items} />
            </nav>
        </header>
    )
}
