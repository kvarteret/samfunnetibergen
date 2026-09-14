import { ArrowUpRight } from "lucide-react"

import { Link } from "@/i18n/navigation"

interface EventsPageHeaderProps {
  actionHref: string
  actionLabel: string
  breadcrumbLabel: string
  eyebrowLabel: string
  title: string
}

export function EventsPageHeader({
  actionHref,
  actionLabel,
  breadcrumbLabel,
  eyebrowLabel,
  title,
}: EventsPageHeaderProps) {
  return (
    <header className="space-y-8">
      <nav
        aria-label={breadcrumbLabel}
        className="text-base text-foreground-muted"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link
              className="underline underline-offset-4 hover:no-underline focus-brutal"
              href="/"
            >
              {breadcrumbLabel}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {title}
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-heading text-sm uppercase tracking-[0.18em] text-foreground-muted">
            {eyebrowLabel}
          </p>
          <h1 className="mt-3 wrap-break-word text-4xl leading-none sm:text-6xl">
            {title}
          </h1>
        </div>
        <Link
          className="inline-flex items-center gap-3 border border-border bg-card px-4 py-3 text-lg text-foreground hover:underline hover:underline-offset-4 focus-brutal"
          href={actionHref}
        >
          {actionLabel}
          <ArrowUpRight aria-hidden className="size-5" />
        </Link>
      </div>
    </header>
  )
}
