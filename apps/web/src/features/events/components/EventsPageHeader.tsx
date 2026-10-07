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
    <header className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-page-title">{title}</h1>
        <Link
          className="inline-flex items-center gap-3 border border-border bg-card px-4 py-3 text-lg text-foreground hover:underline hover:underline-offset-4 focus-brutal"
          href={actionHref}
        >
          {actionLabel}
          <ArrowUpRight aria-hidden className="size-5" />
        </Link>
      </div>
      <p className="text-sm text-foreground-muted">
        Arrangerer du noe på Kvarteret?{" "}
        <Link
          className="inline-flex items-center gap-1 underline underline-offset-4 transition-colors hover:text-foreground focus-brutal"
          href="/arrangementer/ny"
        >
          Få ditt arrangement her
          <ArrowUpRight aria-hidden className="size-3.5" />
        </Link>
      </p>
    </header>
  )
}
