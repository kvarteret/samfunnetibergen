"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { Dialog } from "@base-ui/react/dialog"
import { ChevronDown, ExternalLink, Menu, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Link, usePathname } from "@/i18n/navigation"
import type { SiteLogoContent } from "@/lib/sanity/fetch"
import { cn } from "@/lib/utils"
import { BrandLogo } from "./BrandLogo"
import { LanguageSwitcher } from "./LanguageSwitcher"
import {
  isNavigationItemActive,
  isNavigationLinkActive,
} from "./navigation-items"
import type {
  NavigationGroup,
  NavigationItem,
  NavigationLink,
} from "./navigation-items"
import { PaperMenuSection } from "./PaperPicker"

type MobileMenuProps = {
  items: NavigationItem[]
  logo?: SiteLogoContent | null
}

const navShellClass =
  "mx-auto flex w-full max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-14"
const brandLinkClass = "block py-2.5 transition-opacity hover:opacity-75"

export function MobileMenu({ items, logo }: MobileMenuProps) {
  const t = useTranslations("Navigation")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [menuSessionKey, setMenuSessionKey] = useState(0)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) setMenuSessionKey(key => key + 1)
  }

  const close = () => {
    setOpen(false)
  }

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Trigger
        aria-label={t("openMenu")}
        className="p-3 text-foreground focus-brutal lg:hidden"
      >
        <Menu aria-hidden className="size-6" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Popup
          className="fixed inset-0 z-100 flex flex-col overflow-hidden bg-background lg:hidden"
          key={menuSessionKey}
        >
          <Dialog.Title className="sr-only">{t("mainMenu")}</Dialog.Title>

          <div className="shrink-0 pt-[env(safe-area-inset-top)]">
            <div className={navShellClass}>
              <Link
                aria-label="Samfunnet i Bergen"
                className={`${brandLinkClass} focus-brutal`}
                href="/"
                onClick={close}
              >
                <BrandLogo
                  className="h-8 w-auto sm:h-10"
                  logo={logo}
                  targetHeight={40}
                />
              </Link>
              <Dialog.Close
                aria-label={t("closeMenu")}
                className="p-3 text-foreground focus-brutal"
              >
                <X aria-hidden className="size-6" />
              </Dialog.Close>
            </div>
          </div>

          <nav
            aria-label={t("mobileAriaLabel")}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <AccordionPrimitive.Root
              className="flex min-h-full flex-col divide-y-2 divide-border"
              multiple={false}
            >
              {items.map(item => (
                <MobileNavItem
                  item={item}
                  key={item.id}
                  onClose={close}
                  pathname={pathname}
                />
              ))}
            </AccordionPrimitive.Root>
          </nav>
          <div className="shrink-0 border-t-2 border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <LanguageSwitcher onNavigate={close} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─── MobileNavItem ────────────────────────────────────────────────────────────

interface MobileNavItemProps {
  item: NavigationItem
  onClose: () => void
  pathname: string
}

function MobileNavItem({ item, onClose, pathname }: MobileNavItemProps) {
  const mobileItem = item.mobile
    ? { ...item, href: item.mobile.href, children: item.mobile.groups }
    : item
  const hasChildren =
    mobileItem.children?.some(group => group.links.length > 0) ?? false
  const active = isNavigationItemActive(item, pathname)
  const activeClass =
    "after:absolute after:inset-x-6 after:bottom-0 after:h-0.5 after:bg-[#eb3b3b]"
  const linkCls = cn(
    "relative flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 border-2 border-transparent px-6 py-2.5 text-left font-heading text-2xl text-foreground hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm hs:hover:border-transparent hs:hover:bg-transparent hs:hover:text-foreground hs:hover:shadow-none focus-brutal",
    active && activeClass,
    item.highlight &&
      "border-primary bg-primary text-primary-foreground shadow-hard-sm hover:border-primary hover:bg-primary hover:text-primary-foreground",
  )

  return (
    <AccordionPrimitive.Item value={item.id}>
      {hasChildren ? (
        <>
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger
              className={cn(linkCls, "group")}
              type="button"
            >
              {item.label}
              <ChevronDown
                aria-hidden
                className="size-[1em] shrink-0 text-foreground-muted transition-transform group-data-panel-open:rotate-180"
                strokeWidth={1.75}
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>

          <AccordionPrimitive.Panel className="divide-y divide-border/50">
            {mobileItem.children?.map((group: NavigationGroup) =>
              group.links.map(link => (
                <MobileNavLink
                  key={link.id}
                  link={link}
                  onClose={onClose}
                  pathname={pathname}
                />
              )),
            )}
            {item.includePaperMenu && <PaperMenuSection mobile />}
          </AccordionPrimitive.Panel>
        </>
      ) : (
        renderNavItemLabel(mobileItem, onClose, linkCls, active)
      )}
    </AccordionPrimitive.Item>
  )
}

function MobileNavLink({
  link,
  onClose,
  pathname,
}: {
  link: NavigationLink
  onClose: () => void
  pathname: string
}) {
  const active = isNavigationLinkActive(link, pathname)
  const className = cn(
    "relative flex min-h-11 items-center border-2 border-transparent px-10 py-2.5 text-foreground-muted hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm hs:hover:border-transparent hs:hover:bg-transparent hs:hover:text-foreground-muted hs:hover:shadow-none focus-brutal",
    active &&
      "after:absolute after:inset-x-10 after:bottom-0 after:h-0.5 after:bg-[#eb3b3b]",
  )

  if (link.kind === "external") {
    return (
      <a
        className={className}
        href={link.href ?? "#"}
        aria-current={active ? "page" : undefined}
        onClick={onClose}
        rel="noreferrer"
        target="_blank"
      >
        {link.label}
        <ExternalLink
          aria-hidden="true"
          className="ml-2 inline size-3.5 shrink-0"
        />
      </a>
    )
  }

  if (link.kind === "plain") {
    return (
      <a
        aria-current={active ? "page" : undefined}
        className={className}
        href={link.href ?? "#"}
        onClick={onClose}
      >
        {link.label}
      </a>
    )
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={className}
      href={link.href ?? "#"}
      onClick={onClose}
    >
      {link.label}
    </Link>
  )
}

function renderNavItemLabel(
  item: NavigationLink,
  onClose: () => void,
  linkCls: string,
  active: boolean,
) {
  const href = item.href
  if (!href)
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
  if (item.kind === "external") {
    return (
      <a
        aria-current={active ? "page" : undefined}
        className={linkCls}
        href={href}
        onClick={onClose}
        rel="noreferrer"
        target="_blank"
      >
        {item.label}
        <ExternalLink
          aria-hidden="true"
          className="ml-2 inline size-[0.7em] shrink-0"
        />
      </a>
    )
  }
  if (item.kind === "plain") {
    return (
      <a
        aria-current={active ? "page" : undefined}
        className={linkCls}
        href={href}
        onClick={onClose}
      >
        {item.label}
      </a>
    )
  }
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={linkCls}
      href={href}
      onClick={onClose}
    >
      {item.label}
    </Link>
  )
}
