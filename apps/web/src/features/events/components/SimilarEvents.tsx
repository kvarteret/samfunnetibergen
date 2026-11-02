import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { buildCardDateLabels } from "@/features/events/domain/dates"
import type { PublicEvent } from "@/features/events/domain/events"
import { rankSimilarEvents } from "@/features/events/domain/similar-events"
import { getCardDateLabels } from "@/features/events/server/card-date-labels"
import { fetchPublicEventSet } from "@/features/events/server/public-events"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { getOsloDateString } from "@/lib/sanity/fetch/shared"
import { EventCard } from "./EventCard"

/**
 * "Du er kanskje også interessert i" under an event page: up to three
 * upcoming events that share its type, category, organizers or room, filled
 * up with other upcoming events. Renders nothing when there are none.
 */
export async function SimilarEvents({
  event,
  locale,
}: {
  event: PublicEvent
  locale: AppLocale
}) {
  const today = getOsloDateString()
  const [{ events }, labels, t] = await Promise.all([
    fetchPublicEventSet({ locale, from: today, to: null }),
    getCardDateLabels(locale),
    getTranslations({ locale, namespace: "EventPage" }),
  ])
  const similarEvents = rankSimilarEvents(event, events, today)
  if (similarEvents.length === 0) return null

  const taxonomyGroupName = event.eventType?.taxonomyGroup?.name
  const moreHref = taxonomyGroupName
    ? `/arrangementer?taxonomy=${encodeURIComponent(taxonomyGroupName)}`
    : "/arrangementer"

  return (
    <section aria-labelledby="similar-events-heading" className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="similar-events-heading" className="text-section-title">
          {t("similarEvents")}
        </h2>
        <Link
          href={moreHref}
          className="inline-flex items-center gap-2 underline underline-offset-4 hover:no-underline focus-brutal"
        >
          {t("similarEventsMore")}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      <ul className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-8">
        {similarEvents.map((similarEvent, index) => (
          <li key={similarEvent._id} className="min-w-0">
            <EventCard
              variant="catalogue"
              trackingSurface="detail-similar"
              trackingPosition={index + 1}
              event={{
                ...similarEvent,
                ...buildCardDateLabels(similarEvent, today, labels),
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
