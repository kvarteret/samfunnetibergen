import { EventsProvider } from "@/features/events/context/EventsContext"
import type {
  PublicEvent,
  PublicOccurrence,
} from "@/features/events/domain/events"
import type { AppLocale } from "@/i18n/routing"
import { EventCalendar } from "./EventCalendar"
import { EventsPageFilters } from "./EventsPageFilters"
import { EventsPageHeader } from "./EventsPageHeader"

interface EventCalendarPageProps {
  arrangements: PublicEvent[]
  backLabel: string
  listLabel: string
  locale: AppLocale
  occurrences: PublicOccurrence[]
  searchParams: Record<string, string | string[] | undefined>
  title: string
  today: string
}

export function EventCalendarPage({
  arrangements,
  backLabel,
  listLabel,
  locale,
  occurrences,
  searchParams,
  title,
  today,
}: EventCalendarPageProps) {
  return (
    <EventsProvider
      initialEvents={arrangements}
      initialOccurrences={occurrences}
      initialSearchParams={searchParams}
    >
      <div className="flex flex-col gap-12">
        <EventsPageHeader
          actionHref="/arrangementer"
          actionLabel={listLabel}
          breadcrumbLabel={backLabel}
          title={title}
        />

        <EventsPageFilters />

        <EventCalendar locale={locale} today={today} />
      </div>
    </EventsProvider>
  )
}
