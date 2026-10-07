import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { buildCardDateLabels } from "@/features/events/domain/dates"
import {
  filterToFirstInstances,
  organizerGroupsOf,
} from "@/features/events/domain/eventUtils"
import { getCardDateLabels } from "@/features/events/server/card-date-labels"
import { fetchPublicEventSet } from "@/features/events/server/public-events"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import { EventCard } from "./EventCard"

const MAX_GROUP_EVENTS = 6

/**
 * Upcoming events a group organises or co-organises, as catalogue cards.
 * Renders nothing when the group has no upcoming public events.
 */
export async function GroupEvents({
  groupId,
  locale,
}: {
  groupId: string
  locale: AppLocale
}) {
  const today = getOsloDateString()
  const [{ events }, labels, t, cardT] = await Promise.all([
    fetchPublicEventSet({ locale, from: today, to: null }),
    getCardDateLabels(locale),
    getTranslations({ locale, namespace: "GroupPage" }),
    getTranslations({ locale, namespace: "EventCard" }),
  ])
  const groupEvents = filterToFirstInstances(
    events.filter(event =>
      organizerGroupsOf(event).some(group => group._id === groupId),
    ),
  )
  if (groupEvents.length === 0) return null

  return (
    <section aria-labelledby="group-events-heading" className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-2 border-border pb-3">
        <h2 id="group-events-heading" className="text-section-title">
          {t("upcomingEvents")}
        </h2>
        {groupEvents.length > MAX_GROUP_EVENTS && (
          <Link
            href={`/arrangementer?organizer=${encodeURIComponent(groupId)}`}
            className="inline-flex items-center gap-2 underline underline-offset-4 hover:no-underline focus-brutal"
          >
            {t("allEvents", { count: groupEvents.length })}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </div>
      <ul className="grid gap-x-6 gap-y-10 md:grid-cols-2">
        {groupEvents.slice(0, MAX_GROUP_EVENTS).map((event, index) => (
          <li key={event._id} className="min-w-0">
            <EventCard
              variant="catalogue"
              trackingSurface="group-events"
              trackingPosition={index + 1}
              event={{
                ...event,
                ...buildCardDateLabels(event, today, labels),
                statusLabel:
                  event.eventStatus === "cancelled"
                    ? cardT("statusCancelled")
                    : null,
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
