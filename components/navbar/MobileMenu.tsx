"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { NavGroup, NavItem, NavLeaf } from "@/lib/sanity/types"

type MobileMenuProps = {
    items: NavItem[]
    fallbackItems: { label: string; href: string }[]
}

export function MobileMenu({ items, fallbackItems }: MobileMenuProps) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!open) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("keydown", handler)
        return () => document.removeEventListener("keydown", handler)
    }, [open])

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [open])

    return (
        <>
            <button
                aria-expanded={open}
                aria-label={open ? "Lukk meny" : "Åpne meny"}
                className="relative p-2 lg:hidden"
                onClick={() => setOpen(v => !v)}
                type="button"
            >
                <span className="relative block size-6">
                    <Menu
                        aria-hidden
                        className={cn(
                            "absolute inset-0 size-6 text-foreground transition-all duration-150",
                            open ? "scale-50 rotate-45 opacity-0" : "scale-100 rotate-0 opacity-100",
                        )}
                    />
                    <X
                        aria-hidden
                        className={cn(
                            "absolute inset-0 size-6 text-foreground transition-all duration-150",
                            open ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-45 opacity-0",
                        )}
                    />
                </span>
            </button>

            <div
                aria-hidden={!open}
                className={cn(
                    "fixed inset-x-0 bottom-0 top-[calc(var(--navbar-height,57px))] z-40 border-t-2 border-border bg-background lg:hidden",
                    "transition-all duration-200 ease-out",
                    open
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-2 opacity-0",
                )}
            >
                <nav
                    aria-label="Mobilnavigasjon"
                    className="flex h-full flex-col divide-y-2 divide-border overflow-y-auto"
                >
                    {items.length > 0
                        ? items.map(item => (
                              <MobileNavItem
                                  item={item}
                                  key={item._key}
                                  onClose={() => setOpen(false)}
                              />
                          ))
                        : fallbackItems.map(item => (
                              <Link
                                  className="block px-6 py-4 font-heading text-xl text-foreground"
                                  href={item.href}
                                  key={item.href}
                                  onClick={() => setOpen(false)}
                              >
                                  {item.label}
                              </Link>
                          ))}
                </nav>
            </div>
        </>
    )
}

interface MobileNavItemProps {
    item: NavItem
    onClose: () => void
}

function MobileNavItem({ item, onClose }: MobileNavItemProps) {
    const hasLink = item.href || item.externalUrl

    return (
        <div>
            {hasLink ? (
                item.externalUrl && !item.href ? (
                    <a
                        className="block px-6 py-4 font-heading text-xl text-foreground"
                        href={item.externalUrl}
                        onClick={onClose}
                        rel="noreferrer"
                        target="_blank"
                    >
                        {item.label}
                    </a>
                ) : (
                    <Link
                        className="block px-6 py-4 font-heading text-xl text-foreground"
                        href={item.href ?? "#"}
                        onClick={onClose}
                    >
                        {item.label}
                    </Link>
                )
            ) : (
                <p className="block px-6 py-4 font-heading text-xl text-foreground">
                    {item.label}
                </p>
            )}
            {item.children?.map((group: NavGroup) =>
                group.items?.map((leaf: NavLeaf) => (
                    <Link
                        className="block border-t border-border px-10 py-3 text-sm text-foreground/70"
                        href={leaf.href ?? leaf.externalUrl ?? "#"}
                        key={leaf._key}
                        onClick={onClose}
                    >
                        {leaf.label}
                    </Link>
                )),
            )}
        </div>
    )
}
