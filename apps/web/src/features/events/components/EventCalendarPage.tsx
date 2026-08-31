import { List } from "lucide-react"

import { EventsProvider } from "@/features/events/context/EventsContext"
import type { PublishedEvent } from "@/features/events/domain/eventUtils"
import type { AppLocale } from "@/i18n/routing"
import { Link } from "@/i18n/navigation"
import { EventsPageFilters } from "./EventsPageFilters"
import { EventCalendar } from "./EventCalendar"

interface EventCalendarPageProps {
  arrangements: PublishedEvent[]
  backLabel: string
  listLabel: string
  locale: AppLocale
  searchParams: Record<string, string | string[] | undefined>
  title: string
  today: string
}

export function EventCalendarPage({
  arrangements,
  backLabel,
  listLabel,
  locale,
  searchParams,
  title,
  today,
}: EventCalendarPageProps) {
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-heading text-3xl sm:text-4xl">{title}</h1>
            <Link
              className="inline-flex items-center gap-2 font-heading uppercase tracking-widest underline underline-offset-4 focus-brutal"
              href="/arrangementer"
            >
              <List className="size-4" aria-hidden />
              {listLabel}
            </Link>
          </div>
        </header>

        <EventsPageFilters />

        <EventCalendar locale={locale} today={today} />
      </div>
    </EventsProvider>
  )
}
