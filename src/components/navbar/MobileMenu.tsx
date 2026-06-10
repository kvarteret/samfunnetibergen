"use client"

import { Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import type { NavGroup, NavItem, NavLeaf } from "@/lib/sanity/fetch"
import { cn } from "@/lib/utils"

type MobileMenuProps = {
  items: NavItem[]
}

const subscribe = () => () => {}
const navShellClass =
  "mx-auto flex w-full max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-14"
const brandLinkClass = "block py-2.5 transition-opacity hover:opacity-75"

export function MobileMenu({ items }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={open ? "Lukk meny" : "Åpne meny"}
        className="relative p-3 lg:hidden"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <span className="relative block size-6">
          <Menu
            aria-hidden
            className={cn(
              "absolute inset-0 size-6 text-foreground transition-all duration-150",
              open ? "scale-50 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <X
            aria-hidden
            className={cn(
              "absolute inset-0 size-6 text-foreground transition-all duration-150",
              open ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          />
        </span>
      </button>

      {mounted &&
        createPortal(
          <div
            aria-hidden={!open}
            aria-modal={open}
            role={open ? "dialog" : undefined}
            className={cn(
              "fixed inset-0 z-[100] flex flex-col bg-background lg:hidden",
              "transition-[opacity,transform] duration-200 ease-out",
              open
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-3 opacity-0",
            )}
          >
            <div className="shrink-0 border-b-2 border-border">
              <div className={navShellClass}>
                <Link
                  aria-label="Samfunnet i Bergen"
                  className={brandLinkClass}
                  href="/"
                  onClick={close}
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
                <button
                  aria-label="Lukk meny"
                  className="p-3 text-foreground"
                  onClick={close}
                  type="button"
                >
                  <X aria-hidden className="size-6" />
                </button>
              </div>
            </div>

            <nav
              aria-label="Mobilnavigasjon"
              className="flex flex-1 flex-col divide-y-2 divide-border overflow-y-auto"
            >
              {items.map((item, i) => (
                <MobileNavItem
                  index={i}
                  item={item}
                  key={item._key}
                  onClose={close}
                  open={open}
                />
              ))}
            </nav>
          </div>,
          document.body,
        )}
    </>
  )
}

// ─── MobileNavItem ────────────────────────────────────────────────────────────

interface MobileNavItemProps {
  item: NavItem
  onClose: () => void
  open: boolean
  index: number
}

function MobileNavItem({ item, onClose, open, index }: MobileNavItemProps) {
  const delay = open ? `${index * 35 + 60}ms` : "0ms"

  const linkCls = cn(
    "block px-6 py-5 font-heading text-2xl text-foreground",
    "transition-[opacity,transform] duration-300 hover:bg-muted",
    open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
  )

  return (
    <div style={{ transitionDelay: delay }}>
      {renderNavItemLabel(item, onClose, linkCls)}

      {item.children?.map((group: NavGroup) =>
        group.items?.map((leaf: NavLeaf) => (
          <Link
            className="block border-t border-border/50 px-10 py-3 text-sm text-foreground/60 transition-colors hover:bg-muted"
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

function renderNavItemLabel(
  item: NavLeaf,
  onClose: () => void,
  linkCls: string,
) {
  const hasLink = item.href || item.externalUrl
  if (!hasLink) return <p className={linkCls}>{item.label}</p>
  if (item.externalUrl && !item.href) {
    return (
      <a
        className={linkCls}
        href={item.externalUrl}
        onClick={onClose}
        rel="noreferrer"
        target="_blank"
      >
        {item.label}
      </a>
    )
  }
  return (
    <Link className={linkCls} href={item.href ?? "#"} onClick={onClose}>
      {item.label}
    </Link>
  )
}
