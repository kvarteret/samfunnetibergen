"use client"

import { ChevronDown, Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Dialog as DialogPrimitive } from "radix-ui"
import { useState } from "react"
import type { NavGroup, NavItem, NavLeaf } from "@/lib/sanity/fetch"
import { cn } from "@/lib/utils"
import { PaperMenuSection } from "./PaperPicker"

type MobileMenuProps = {
  items: NavItem[]
}

const navShellClass =
  "mx-auto flex w-full max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-14"
const brandLinkClass = "block py-2.5 transition-opacity hover:opacity-75"

export function MobileMenu({ items }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <DialogPrimitive.Root onOpenChange={setOpen} open={open}>
      <DialogPrimitive.Trigger asChild>
        <button
          aria-label="Åpne meny"
          className="p-3 text-foreground focus-brutal lg:hidden"
          type="button"
        >
          <Menu aria-hidden className="size-6" />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-100 flex flex-col bg-background lg:hidden"
        >
          <DialogPrimitive.Title className="sr-only">
            Hovedmeny
          </DialogPrimitive.Title>

          <div className="shrink-0 border-b-2 border-border">
            <div className={navShellClass}>
              <Link
                aria-label="Samfunnet i Bergen"
                className={`${brandLinkClass} focus-brutal`}
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
              <DialogPrimitive.Close asChild>
                <button
                  aria-label="Lukk meny"
                  className="p-3 text-foreground focus-brutal"
                  type="button"
                >
                  <X aria-hidden className="size-6" />
                </button>
              </DialogPrimitive.Close>
            </div>
          </div>

          <nav
            aria-label="Mobilnavigasjon"
            className="flex flex-1 flex-col divide-y-2 divide-border overflow-y-auto"
          >
            {items.map(item => (
              <MobileNavItem item={item} key={item._key} onClose={close} />
            ))}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ─── MobileNavItem ────────────────────────────────────────────────────────────

interface MobileNavItemProps {
  item: NavItem
  onClose: () => void
}

function MobileNavItem({ item, onClose }: MobileNavItemProps) {
  const linkCls =
    "block cursor-pointer border-2 border-transparent px-6 py-5 font-heading text-2xl text-foreground hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm focus-brutal"

  return (
    <div>
      {renderNavItemLabel(item, onClose, linkCls)}

      {item.children?.map((group: NavGroup) =>
        group.items?.map((leaf: NavLeaf) => (
          <Link
            className="block cursor-pointer border-2 border-transparent border-t-border/50 px-10 py-3 text-foreground-muted hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm focus-brutal"
            href={leaf.href ?? leaf.externalUrl ?? "#"}
            key={leaf._key}
            onClick={onClose}
          >
            {leaf.label}
          </Link>
        )),
      )}
      {item._key === "static-more" && <PaperMenuSection mobile />}
    </div>
  )
}

function renderNavItemLabel(
  item: NavLeaf,
  onClose: () => void,
  linkCls: string,
) {
  const hasLink = item.href || item.externalUrl
  if (!hasLink)
    return (
      <p className={cn(linkCls, "flex items-center justify-between")}>
        {item.label}
        <ChevronDown
          aria-hidden
          className="size-[1em] text-foreground-muted"
          strokeWidth={1.75}
        />
      </p>
    )
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
