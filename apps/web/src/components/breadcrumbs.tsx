import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

/**
 * Breadcrumb labels are looked up per URL segment in the `Breadcrumbs`
 * namespace. Segments without an entry (dynamic slugs) fall back to a
 * humanized version of the URL segment, or to `current` when a page passes its
 * real title.
 */
const SEGMENT_LABEL_KEYS: Record<string, string> = {
  arrangementer: "events",
  kalender: "calendar",
  ny: "newEvent",
  grupper: "groups",
  blifrivillig: "volunteer",
  rom: "rooms",
  book: "book",
  karaoke: "karaoke",
  nyttig: "useful",
  kontakt: "contact",
  sponsorer: "sponsors",
  design: "design",
}

function humanize(segment: string): string {
  const decoded = decodeURIComponent(segment).replace(/-/g, " ")
  return decoded.charAt(0).toLocaleUpperCase() + decoded.slice(1)
}

interface BreadcrumbsProps {
  /** Locale-less path of the current page, e.g. `/rom/grondahls`. */
  path: string
  /** Real title for the current page when the segment is a dynamic slug. */
  current?: string
  className?: string
}

/**
 * Generates the ancestor trail from `path` so every page renders the same
 * "Forsiden / … / Current page" breadcrumb server-side (no hydration flash).
 */
export async function Breadcrumbs({
  path,
  current,
  className,
}: BreadcrumbsProps) {
  const segments = path.split("/").filter(Boolean)
  if (segments.length === 0) return null

  const t = await getTranslations("Breadcrumbs")

  return (
    <nav
      aria-label={t("ariaLabel")}
      className={cn("text-base text-foreground-muted", className)}
    >
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            className="underline underline-offset-4 hover:no-underline focus-brutal"
            href="/"
          >
            {t("home")}
          </Link>
        </li>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const href = `/${segments.slice(0, index + 1).join("/")}`
          const labelKey = SEGMENT_LABEL_KEYS[segment]
          const label =
            (isLast ? current : null) ??
            (labelKey && t.has(labelKey) ? t(labelKey) : humanize(segment))

          return (
            <li className="flex items-center gap-2" key={href}>
              <span aria-hidden="true">/</span>
              {isLast ? (
                <span aria-current="page" className="text-foreground">
                  {label}
                </span>
              ) : (
                <Link
                  className="underline underline-offset-4 hover:no-underline focus-brutal"
                  href={href}
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
