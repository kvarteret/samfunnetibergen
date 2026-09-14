"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { Dialog } from "@base-ui/react/dialog"
import { ChevronDown, ExternalLink, Menu, X } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import type {
  NavGroup,
  NavItem,
  NavLeaf,
  SiteLogoContent,
} from "@/lib/sanity/fetch"
import { cn } from "@/lib/utils"
import { BrandLogo } from "./BrandLogo"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { PaperMenuSection } from "./PaperPicker"

type MobileMenuProps = {
  items: NavItem[]
  logo?: SiteLogoContent | null
}

const navShellClass =
  "mx-auto flex w-full max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-14"
const brandLinkClass = "block py-2.5 transition-opacity hover:opacity-75"

export function MobileMenu({ items, logo }: MobileMenuProps) {
  const t = useTranslations("Navigation")
  const [open, setOpen] = useState(false)

  const close = () => {
    setOpen(false)
  }

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger
        aria-label={t("openMenu")}
        className="p-3 text-foreground focus-brutal lg:hidden"
      >
        <Menu aria-hidden className="size-6" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Popup className="fixed inset-0 z-100 flex flex-col overflow-hidden bg-background lg:hidden">
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
                <MobileNavItem item={item} key={item._key} onClose={close} />
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
  item: NavItem
  onClose: () => void
}

function MobileNavItem({ item, onClose }: MobileNavItemProps) {
  const isVolunteer = item._key === "static-volunteer"
  const hasChildren = item.children?.some(group => group.items?.length) ?? false
  const linkCls = cn(
    "flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 border-2 border-transparent px-6 py-2.5 text-left font-heading text-2xl text-foreground hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm focus-brutal",
    isVolunteer &&
      "border-primary bg-primary text-primary-foreground shadow-hard-sm hover:border-primary hover:bg-primary hover:text-primary-foreground",
  )

  return (
    <AccordionPrimitive.Item value={item._key}>
      {hasChildren ? (
        <>
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className={linkCls} type="button">
              {item.label}
              <ChevronDown
                aria-hidden
                className="size-[1em] shrink-0 text-foreground-muted transition-transform group-data-panel-open:rotate-180"
                strokeWidth={1.75}
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>

          <AccordionPrimitive.Panel className="divide-y divide-border/50">
            {item.children?.map((group: NavGroup) =>
              group.items?.map((leaf: NavLeaf) => (
                <MobileNavLink leaf={leaf} key={leaf._key} onClose={onClose} />
              )),
            )}
            {item._key === "static-more" && <PaperMenuSection mobile />}
          </AccordionPrimitive.Panel>
        </>
      ) : (
        renderNavItemLabel(item, onClose, linkCls)
      )}
    </AccordionPrimitive.Item>
  )
}

function MobileNavLink({
  leaf,
  onClose,
}: {
  leaf: NavLeaf
  onClose: () => void
}) {
  const className =
    "flex min-h-11 items-center border-2 border-transparent px-10 py-2.5 text-foreground-muted hover:border-border hover:bg-primary hover:text-primary-foreground hover:shadow-hard-sm focus-brutal"

  if (!leaf.href && leaf.externalUrl) {
    return (
      <a
        className={className}
        href={leaf.externalUrl}
        onClick={onClose}
        rel="noreferrer"
        target="_blank"
      >
        {leaf.label}
        <ExternalLink
          aria-hidden="true"
          className="ml-2 inline size-3.5 shrink-0"
        />
      </a>
    )
  }

  return (
    <Link
      className={className}
      href={leaf.href ?? leaf.externalUrl ?? "#"}
      onClick={onClose}
    >
      {leaf.label}
    </Link>
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
        <ExternalLink
          aria-hidden="true"
          className="ml-2 inline size-[0.7em] shrink-0"
        />
      </a>
    )
  }
  return (
    <Link className={linkCls} href={item.href ?? "#"} onClick={onClose}>
      {item.label}
    </Link>
  )
}
