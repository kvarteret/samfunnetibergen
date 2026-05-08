"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import type { NavGroup, NavItem, NavLeaf } from "@/lib/sanity/types"

type MobileMenuProps = {
    items: NavItem[]
    fallbackItems: { label: string; href: string }[]
}

export function MobileMenu({ items, fallbackItems }: MobileMenuProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                aria-expanded={open}
                aria-label={open ? "Lukk meny" : "Åpne meny"}
                className="p-2 lg:hidden"
                onClick={() => setOpen(v => !v)}
                type="button"
            >
                {open ? (
                    <X aria-hidden className="size-6 text-foreground" />
                ) : (
                    <Menu aria-hidden className="size-6 text-foreground" />
                )}
            </button>

            {open && (
                <div className="fixed inset-0 top-[calc(var(--navbar-height,57px))] z-40 border-t-2 border-border bg-background lg:hidden">
                    <nav
                        aria-label="Mobilnavigasjon"
                        className="flex flex-col divide-y-2 divide-border"
                    >
                        {items.length > 0
                            ? items.map(item => (
                                  <div key={item._key}>
                                      {item.href || item.externalUrl ? (
                                          item.externalUrl && !item.href ? (
                                              <a
                                                  className="block px-6 py-4 font-heading text-xl text-foreground"
                                                  href={item.externalUrl}
                                                  onClick={() => setOpen(false)}
                                                  rel="noreferrer"
                                                  target="_blank"
                                              >
                                                  {item.label}
                                              </a>
                                          ) : (
                                              <Link
                                                  className="block px-6 py-4 font-heading text-xl text-foreground"
                                                  href={item.href ?? "#"}
                                                  onClick={() => setOpen(false)}
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
                                                  onClick={() => setOpen(false)}
                                              >
                                                  {leaf.label}
                                              </Link>
                                          )),
                                      )}
                                  </div>
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
            )}
        </>
    )
}
