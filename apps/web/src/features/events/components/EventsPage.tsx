import { EventsProvider } from "@/features/events/context/EventsContext"
import type { PublicEvent } from "@/features/events/domain/events"
import type { EventDateEntry } from "./EventCard"
import { EventsPageFilters } from "./EventsPageFilters"
import { EventsPageHeader } from "./EventsPageHeader"
import { EventsPageSections } from "./EventsPageSections"

interface EventsPageProps {
  arrangements: PublicEvent[]
  calendarLabel: string
  precomputedDates: Map<
    string,
    {
      resolvedDates: EventDateEntry[]
      recurringLabel: string | null
      primaryDateLabel: string | null
      statusLabel: string | null
    }
  >
  title: string
}

export function EventsPage({
  arrangements,
  calendarLabel,
  precomputedDates,
  title,
}: EventsPageProps) {
  return (
    <EventsProvider initialEvents={arrangements}>
      <div className="flex flex-col gap-12">
        <EventsPageHeader
          actionHref="/arrangementer/kalender"
          actionLabel={calendarLabel}
          title={title}
        />

        <EventsPageFilters />

        <EventsPageSections precomputedDates={precomputedDates} />
      </div>
    </EventsProvider>
  )
}
