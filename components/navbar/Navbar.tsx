import { ChevronDown, Menu, X } from "lucide-react"
import Link from "next/link"
import type { NavbarContent, NavGroup, NavItem, NavLeaf } from "@/lib/sanity/types"

type NavbarProps = {
    navbar: NavbarContent | null
}

function resolveHref(item: { href?: string | null; externalUrl?: string | null }) {
    return item.href ?? item.externalUrl ?? "#"
}

function isExternal(item: { href?: string | null; externalUrl?: string | null }) {
    return !item.href && Boolean(item.externalUrl)
}

function TopLevelItem({ item }: { item: NavItem }) {
    const hasDropdown = (item.children?.length ?? 0) > 0
    const href = resolveHref(item)
    const external = isExternal(item)

    if (!hasDropdown) {
        return (
            <li>
                {external ? (
                    <a
                        className="flex items-center gap-1 px-3 py-2 font-heading text-sm text-foreground transition-colors hover:text-foreground/70"
                        href={href}
                        rel="noreferrer"
                        target="_blank"
                    >
                        {item.label}
                    </a>
                ) : (
                    <Link
                        className="flex items-center gap-1 px-3 py-2 font-heading text-sm text-foreground transition-colors hover:text-foreground/70"
                        href={href}
                    >
                        {item.label}
                    </Link>
                )}
            </li>
        )
    }

    return (
        <li className="group relative">
            <button
                className="flex items-center gap-1 px-3 py-2 font-heading text-sm text-foreground transition-colors hover:text-foreground/70"
                type="button"
            >
                {item.label}
                <ChevronDown
                    aria-hidden
                    className="size-4 transition-transform group-hover:rotate-180"
                />
            </button>

            {/* Dropdown */}
            <div className="invisible absolute left-0 top-full z-50 min-w-[16rem] border-2 border-border bg-background opacity-0 shadow-shadow transition-all group-hover:visible group-hover:opacity-100">
                <div className="grid gap-0 p-4 sm:grid-cols-2">
                    {item.children?.map((group: NavGroup) => (
                        <div className="space-y-1" key={group._key}>
                            {group.groupLabel && (
                                <p className="px-2 py-1 font-heading text-xs uppercase tracking-wider text-foreground/50">
                                    {group.groupLabel}
                                </p>
                            )}
                            {group.items?.map((leaf: NavLeaf) => {
                                const leafHref = resolveHref(leaf)
                                const leafExternal = isExternal(leaf)
                                return leafExternal ? (
                                    <a
                                        className="block rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted"
                                        href={leafHref}
                                        key={leaf._key}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        {leaf.label}
                                    </a>
                                ) : (
                                    <Link
                                        className="block rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted"
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
    if (!navbar?.items?.length) return null

    return (
        <header className="border-b-2 border-border bg-background">
            <nav
                aria-label="Hovednavigasjon"
                className="mx-auto flex max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-14"
            >
                {/* Logo / site name */}
                <Link
                    className="py-4 font-heading text-lg text-foreground"
                    href="/"
                >
                    Samfunnet i Bergen
                </Link>

                {/* Desktop nav */}
                <ul className="hidden items-center gap-1 lg:flex">
                    {navbar.items.map((item: NavItem) => (
                        <TopLevelItem item={item} key={item._key} />
                    ))}
                </ul>

                {/* Mobile: just a placeholder — full implementation beyond this scope */}
                <button
                    aria-label="Åpne meny"
                    className="p-2 lg:hidden"
                    type="button"
                >
                    <Menu aria-hidden className="size-6 text-foreground" />
                </button>
            </nav>
        </header>
    )
}
