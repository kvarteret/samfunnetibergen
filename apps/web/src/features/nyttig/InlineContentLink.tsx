import { ArrowRight, ExternalLink } from "lucide-react"

import { Link } from "@/i18n/navigation"

export interface ContentLink {
  _key?: string | null
  label?: string | null
  href?: string | null
}

const isExternalHref = (href: string) => !href.startsWith("/")

export const InlineContentLink = ({ link }: { link: ContentLink }) => {
  if (!link.href) return null

  const className =
    "group inline-flex items-center gap-2 font-heading underline underline-offset-4"

  return isExternalHref(link.href) ? (
    <a className={className} href={link.href} rel="noreferrer" target="_blank">
      {link.label}
      <ExternalLink aria-hidden className="size-4" />
    </a>
  ) : (
    <Link className={className} href={link.href}>
      {link.label}
      <ArrowRight
        aria-hidden
        className="size-4 transition-transform duration-base ease-out group-hover:translate-x-1"
      />
    </Link>
  )
}
