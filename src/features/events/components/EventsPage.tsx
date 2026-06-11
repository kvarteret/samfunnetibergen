import { CalendarPlus } from "lucide-react"

import { EventsProvider } from "@/features/events/context/EventsContext"
import type { PublishedEvent } from "@/features/events/domain/eventUtils"
import { Link } from "@/i18n/navigation"
import type { EventDateEntry } from "./EventCard"
import { EventsPageFilters } from "./EventsPageFilters"
import { EventsPageSections } from "./EventsPageSections"

interface EventsPageProps {
  arrangements: PublishedEvent[]
  backLabel: string
  precomputedDates: Map<
    string,
    {
      resolvedDates: EventDateEntry[]
      recurringLabel: string | null
      primaryDateLabel: string | null
    }
  >
  searchParams: Record<string, string | string[] | undefined>
  title: string
}

export function EventsPage({
  arrangements,
  backLabel,
  precomputedDates,
  searchParams,
  title,
}: EventsPageProps) {
  return (
    <EventsProvider
      initialEvents={arrangements}
      initialSearchParams={searchParams}
    >
      <div className="flex flex-col gap-10">
        <header className="space-y-5">
          <Link
            className="inline-flex font-heading uppercase tracking-widest underline underline-offset-4 focus-brutal"
            href="/"
          >
            {backLabel}
          </Link>
          <h1 className="font-heading text-4xl">{title}</h1>
        </header>

        <EventsPageFilters />

        <EventsPageSections precomputedDates={precomputedDates} />

        <div className="flex flex-col gap-4 panel sm:flex-row sm:items-center sm:gap-6">
          <div className="flex size-10 shrink-0 items-center justify-center bg-primary">
            <CalendarPlus
              className="size-5 text-primary-foreground"
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading leading-snug text-foreground">
              Arrangerer du eller din organisasjon noe på Samfunnet?
            </p>
            <p className="mt-0.5 text-foreground-muted">
              Legg til arrangementet i listen — det gjennomgås av PR-gruppen og
              publiseres innen 1–3 virkedager.
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-2 border-border bg-primary px-4 py-2.5 font-heading text-primary-foreground shadow-shadow"
            href="/arrangementer/ny"
          >
            Legg til i listen
          </Link>
        </div>
      </div>
    </EventsProvider>
  )
}
