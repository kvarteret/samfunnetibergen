import { ArrowUpRight } from "lucide-react"

import { Link } from "@/i18n/navigation"

interface EventsPageHeaderProps {
  actionHref: string
  actionLabel: string
  title: string
}

export function EventsPageHeader({
  actionHref,
  actionLabel,
  title,
}: EventsPageHeaderProps) {
  return (
    <header className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="wrap-break-word text-4xl leading-none sm:text-6xl">
          {title}
        </h1>
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
